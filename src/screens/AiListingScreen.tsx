import '../lib/polyfills';
import React, { useState, useEffect } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { getPostExitTab, resetToTab } from '../navigation/tabRouting';

import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, doc, onSnapshot } from 'firebase/firestore';
import { getGenerativeModel } from "firebase/ai";
import { storage, db, aiBackend } from '../firebaseConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'AiListing'>;

export function AiListingScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (route.params?.selectedCategory) {
      setCategory(route.params.selectedCategory);
    }
  }, [route.params?.selectedCategory]);

  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    resetToTab(navigation, getPostExitTab(), 'post');
  };

  // Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('New'); // Default to first option
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]); // Array of image URIs
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStep, setAiStep] = useState<'uploading' | 'analyzing' | 'finalizing' | null>(null);

  const conditions = ['New', 'Like New', 'Good', 'Fair'];

  const handlePostItem = () => {
    // Implement post logic here
    console.log({ title, price, category, condition, description, photos });
    resetToTab(navigation, getPostExitTab(), 'post'); // Navigate back after posting (mock behavior)
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const { uri, base64 } = result.assets[0];
      setPhotos([uri]);
      analyzeWithAi(uri, base64 || undefined);
    }
  };

  const analyzeWithAi = async (uri: string, base64?: string) => {
    // Fail-safe check for AbortSignal.any right before AI call
    const g = (typeof global !== 'undefined' ? global : window) as any;
    if (g.AbortSignal && !g.AbortSignal.any) {
      console.warn('AbortSignal.any missing again, applying inline fix... 🛠️');
      g.AbortSignal.any = (signals: any[]) => {
        const c = new AbortController();
        for (const s of signals) {
          if (s.aborted) { c.abort(); break; }
          s.addEventListener('abort', () => c.abort(), { once: true });
        }
        return c.signal;
      };
    }

    setIsAiLoading(true);
    setAiStep('uploading');
    try {
      const filename = uri.split('/').pop();
      const storagePath = `listings/${Date.now()}_${filename}`;
      const storageRef = ref(storage, storagePath);

      const response = await fetch(uri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      setAiStep('analyzing');
      const model = getGenerativeModel(aiBackend, { model: "gemini-2.0-flash" });

      const prompt = `당신은 유럽 최고의 중고 거래 플랫폼 'Adon'의 전문 큐레이터입니다. 
      이 사진 속 상품을 분석하여 하이엔드 중고 리스팅을 작성해주세요.
      
      반드시 다음 JSON 형식을 엄격히 지켜주세요:
      {
        "title": "대표님을 위한 세련되고 직관적인 상품명",
        "price": 유럽 시장 시세를 반영한 유로 가격 (숫자만),
        "category": "추천 카테고리 (가장 적합한 하나)",
        "description": "상품의 가치, 상태, 그리고 구매자의 마음을 사로잡을 섹시하고 전문적인 설명 (한국어로 작성)"
      }
      
      주의사항:
      - 벤치마크 앱(Vinted, Wallapop 등)보다 더 전문적이고 고급스러운 톤앤매너로 작성하세요.
      - 답변은 반드시 한국어로 작성하세요.`;

      let finalBase64 = base64;
      if (!finalBase64) {
        const reader = new FileReader();
        finalBase64 = await new Promise((resolve) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });
      }

      const imagePart = {
        inlineData: {
          data: finalBase64 as string,
          mimeType: "image/jpeg",
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const aiResponse = await result.response;
      const responseText = aiResponse.text();

      setAiStep('finalizing');

      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        if (data) {
          setTitle(data.title || '');
          setPrice(data.price?.toString() || '');
          setCategory(data.category || '');
          setDescription(data.description || '');
          setCondition('Good');
        } else {
          setTitle('AI 분석 완료');
          setDescription(responseText);
        }

        await addDoc(collection(db, 'listings'), {
          image: downloadURL,
          aiResult: data || responseText,
          status: 'completed',
          createdAt: new Date(),
        });

      } catch (e) {
        console.warn('Failed to parse AI JSON:', e);
        setTitle('AI 분석 실패');
        setDescription('AI가 정보를 읽어오는 데 실패했어요. 직접 작성해 보시겠어요?');
      }

      setTimeout(() => {
        setIsAiLoading(false);
        setAiStep(null);
      }, 1000);

    } catch (error: any) {
      console.error('AI Analysis failed:', error);
      setIsAiLoading(false);
      setAiStep(null);

      const errorMessage = error?.message || '알 수 없는 에러가 발생했어요.';
      Alert.alert('AI 분석 오류' + (errorMessage.includes('API_NOT_ENABLED') ? ' (API 미활성화)' : ''),
        `AI가 분석 중에 문제가 생겼어요: ${errorMessage}\n\nFirebase 콘솔에서 AI API가 활성화되어 있는지 확인해 주세요! 💖`);
    }
  };

  const renderAiLoadingOverlay = () => {
    if (!isAiLoading) return null;

    const getStepMessage = () => {
      switch (aiStep) {
        case 'uploading':
          return '사진을 안전하게 클라우드로 전송 중이에요... 📤';
        case 'analyzing':
          return 'Gemini AI가 사진을 꼼꼼히 분석하고 있어요... 🧠✨';
        case 'finalizing':
          return '멋진 제목과 설명을 거의 다 만들었어요! 😍';
        default:
          return 'AI가 하은님의 상품을 분석 중이에요... 🌈';
      }
    };

    return (
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.loadingTitle}>AI 분석 중</Text>
          <Text style={styles.loadingSubtitle}>{getStepMessage()}</Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: aiStep === 'uploading' ? '30%' : aiStep === 'analyzing' ? '70%' : '100%' }
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {renderAiLoadingOverlay()}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Listing</Text>
          <Pressable style={styles.closeBtn} onPress={handleClose}>
            <MaterialIcons name="close" size={24} color="#0f172a" />
          </Pressable>
        </View>

        <Pressable
          style={styles.aiBanner}
          onPress={() => navigation.navigate('AiIntro')}
        >
          <View style={styles.aiBannerContent}>
            <View style={styles.aiIconBadge}>
              <MaterialIcons name="auto-awesome" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.aiBannerTitle}>Try Adon AI Features</Text>
              <Text style={styles.aiBannerSubtitle}>Auto-fill, Pricing & More</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#15803d" />
        </Pressable>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Photos</Text>
            {isAiLoading && (
              <View style={styles.aiLoadingBadge}>
                <MaterialIcons name="auto-awesome" size={14} color="#16a34a" />
                <Text style={styles.aiLoadingText}>AI Analyzing...</Text>
              </View>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
            <Pressable style={styles.addPhotoBtn} onPress={pickImage}>
              <MaterialIcons name="add-a-photo" size={24} color="#19e61b" />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </Pressable>
            {photos.map((uri, index) => (
              <View key={index} style={styles.photoCard}>
                <Image source={{ uri }} style={styles.photoImage} />
                <Pressable
                  style={styles.removePhotoBtn}
                  onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
                >
                  <MaterialIcons name="close" size={12} color="#fff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Nike Air Max 97"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Category Selector (Mock) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <Pressable style={styles.selector} onPress={() => navigation.navigate('CategorySelect')}>
              <Text style={[styles.selectorText, !category && styles.placeholderText]}>
                {category || 'Select Category'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color="#94a3b8" />
            </Pressable>
          </View>

          {/* Price Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currencySymbol}>€</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          {/* Condition Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Condition</Text>
            <View style={styles.conditionRow}>
              {conditions.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.conditionChip, condition === c && styles.conditionChipActive]}
                  onPress={() => setCondition(c)}
                >
                  <Text style={[styles.conditionText, condition === c && styles.conditionTextActive]}>
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your item..."
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

        </ScrollView>

        {/* Footer / CTA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable style={styles.ctaBtn} onPress={handlePostItem}>
            <Text style={styles.ctaText}>Post Item</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f8f6' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f8f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  aiLoadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbfde4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  aiLoadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  photoScroll: {
    flexDirection: 'row',
    marginBottom: 24,
    overflow: 'visible',
  },
  addPhotoBtn: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#19e61b',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    marginRight: 12,
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#19e61b',
    marginTop: 4,
  },
  photoCard: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#e2e8f0',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
  },
  selector: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 16,
    color: '#0f172a',
  },
  placeholderText: {
    color: '#94a3b8',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  conditionChipActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#19e61b',
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  conditionTextActive: {
    color: '#16a34a',
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f6f8f6',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  ctaBtn: {
    backgroundColor: '#19e61b',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#19e61b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#dcfce7',
    marginHorizontal: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  aiBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14532d',
  },
  aiBannerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF3B30',
    borderRadius: 3,
  },
});
