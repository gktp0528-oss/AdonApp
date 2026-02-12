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
  Animated,
  Easing,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { RootStackParamList } from '../navigation/types';
import { getPostExitTab, resetToTab } from '../navigation/tabRouting';

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getGenerativeModel } from "firebase/ai";
import { storage, db, aiBackend } from '../firebaseConfig';

import { listingService } from '../services/listingService';
import { userService } from '../services/userService';
import { ListingCondition } from '../types/listing';

type Props = NativeStackScreenProps<RootStackParamList, 'AiListing'>;

export function AiListingScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Temporary: get current seller ID
  const sellerId = userService.getCurrentUserId();

  useEffect(() => {
    if (route.params?.selectedCategory) {
      setCategory(route.params.selectedCategory);
    }
  }, [route.params?.selectedCategory]);

  useEffect(() => {
    if (route.params?.selectedPrice) {
      setPrice(route.params.selectedPrice);
    }
  }, [route.params?.selectedPrice]);

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
  const [condition, setCondition] = useState<ListingCondition>('New'); // Default to first option
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]); // Array of image URIs
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [aiStep, setAiStep] = useState<'uploading' | 'analyzing' | 'finalizing' | null>(null);
  const [aiLiveFeed, setAiLiveFeed] = useState<string[]>([]);
  const [scannerAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));
  const [displayProgress, setDisplayProgress] = useState(0);
  const [aiPriceRange, setAiPriceRange] = useState<{ min: number, max: number } | null>(null);

  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) => {
      setDisplayProgress(Math.floor(value));
    });
    return () => progressAnim.removeListener(listenerId);
  }, []);

  useEffect(() => {
    if (isAiLoading) {
      setAiLiveFeed(['⚡️ Adon Vision Engine 초기화 중...']);
      Animated.loop(
        Animated.sequence([
          Animated.timing(scannerAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scannerAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scannerAnim.setValue(0);
    }
  }, [isAiLoading]);

  const addFeed = (msg: string) => {
    setAiLiveFeed(prev => [...prev.slice(-4), msg]);
  };

  const conditions: ListingCondition[] = ['New', 'Like New', 'Good', 'Fair'];
  const conditionLabelMap: Record<ListingCondition, string> = {
    New: t('post.conditionNew') || '새 상품',
    'Like New': t('post.conditionLikeNew') || '거의 새것',
    Good: t('post.conditionGood') || '양호',
    Fair: t('post.conditionFair') || '사용감 있음',
  };

  const handlePostItem = async () => {
    if (isPosting) return;

    const normalizedTitle = title.trim();
    const normalizedCategory = category.trim();
    const normalizedDescription = description.trim();
    const normalizedPrice = Number(price.replace(',', '.'));

    if (!normalizedTitle) {
      Alert.alert(t('post.enterTitle'));
      return;
    }
    if (!normalizedCategory) {
      Alert.alert(t('post.selectCategoryFirst'));
      return;
    }
    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      Alert.alert(t('post.enterValidPrice'));
      return;
    }
    if (!normalizedDescription) {
      Alert.alert(t('post.enterDescription'));
      return;
    }
    if (photos.length === 0) {
      Alert.alert(t('post.addAtLeastOnePhoto'));
      return;
    }

    setIsPosting(true);
    try {
      const uploadedPhotos = await Promise.all(
        photos.map(async (uri, index) => {
          if (uri.startsWith('http')) {
            return uri;
          }

          const filename = uri.split('/').pop() || `listing_${index}.jpg`;
          const storagePath = `listings/photos/${Date.now()}_${index}_${filename}`;
          const storageRef = ref(storage, storagePath);
          const response = await fetch(uri);
          const blob = await response.blob();
          await uploadBytes(storageRef, blob);
          return getDownloadURL(storageRef);
        })
      );

      await listingService.createListing({
        title: normalizedTitle,
        price: normalizedPrice,
        category: normalizedCategory,
        condition,
        description: normalizedDescription,
        photos: uploadedPhotos,
        currency: 'EUR',
        status: 'active',
        sellerId: sellerId,
        originLanguage: i18n.language, // Track original language for AliExpress-style auto-translation
      });

      Alert.alert(t('post.postSuccess'), t('post.postSuccessMsg'), [
        {
          text: t('common.confirm'),
          onPress: () => resetToTab(navigation, getPostExitTab(), 'post'),
        },
      ]);
    } catch (error: any) {
      console.error('Post Item failed:', error);
      Alert.alert(
        t('post.postFailed'),
        t('post.postFailedMsg', { error: error?.message || t('common.unknownError') })
      );
    } finally {
      setIsPosting(false);
    }
  };

  const pickImage = async () => {
    if (photos.length >= 10) {
      Alert.alert(t('post.maxPhotosAlert'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 10 - photos.length,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(a => a.uri);
      const combinedPhotos = [...photos, ...newUris];
      setPhotos(combinedPhotos);

      // Immediate visual feedback
      setIsAiLoading(true);
      setAiStep('uploading');
      progressAnim.setValue(0);

      // Analyze all selected photos together
      analyzePhotosWithAi(newUris);
    }
  };

  const processImage = async (uri: string) => {
    try {
      const manipulResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 512 } }], // Aggressive resize to 512px for speed
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipulResult.uri;
    } catch (error) {
      console.warn('Image resizing failed, using original:', error);
      return uri;
    }
  };

  const analyzePhotosWithAi = async (originalUris: string[]) => {
    // If somehow not already loading, ensure it starts
    if (!isAiLoading) setIsAiLoading(true);
    if (!aiStep) setAiStep('uploading');

    // Smoothly animate to 15% immediately for 'uploading' start
    Animated.timing(progressAnim, { toValue: 15, duration: 1000, useNativeDriver: false }).start();

    // Fail-safe check
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

    addFeed(t('post.aiScannedMsg'));
    addFeed(t('post.aiUploadingMsg'));

    try {
      // Optimize images before upload & analysis
      const uris = await Promise.all(originalUris.map(uri => processImage(uri)));

      const primaryUri = uris[0];
      const filename = primaryUri.split('/').pop();
      const storagePath = `listings/ai_logs/${Date.now()}_${filename}`;
      const storageRef = ref(storage, storagePath);

      const response = await fetch(primaryUri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      Animated.timing(progressAnim, { toValue: 40, duration: 1500, useNativeDriver: false }).start();
      setAiStep('analyzing');
      addFeed(t('post.aiGearingUpMsg'));
      const model = getGenerativeModel(aiBackend, { model: "gemini-2.5-flash-lite" });

      // Prepare all images for Gemini
      const imageParts = await Promise.all(uris.map(async (uri, idx) => {
        // addFeed(`📸 ${idx + 1}번 이미지 정밀 스캔 중...`); // Reduced clutter
        const resp = await fetch(uri);
        const b = await resp.blob();
        const base64: string = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(b);
        });
        return {
          inlineData: {
            data: base64,
            mimeType: "image/jpeg",
          },
        };
      }));

      const prompt = `당신은 유럽(독일, 프랑스, 스페인 등)의 중고 마켓(eBay, Vinted, Wallapop) 시세에 정통한 매우 보수적이고 객관적인 가격 책정 전문가입니다.
      
      [분석 지침]
      1. 제품의 정확한 모델명을 식별하세요.
      2. 사진에서 스크래치, 찍힘, 오염, 사용감 등 '감가 요인'을 이 잡듯 찾아내십시오. 
      3. 가격 책정 시 매우 보수적이어야 합니다. 조금이라도 흠집이 있다면 '최상의 상태' 시세보다 최소 20-30% 이상 낮은 가격을 제시하세요.
      4. 특히 에어팟 같은 소모품은 배터리 수명과 외관 스크래치가 가격에 치명적임을 반영하세요.
      5. 제품의 카테고리를 다음 중 하나로 분류하세요: Fashion, Luxury, Electronics, Home & Living, Sports & Leisure, Other.
      
      다음 JSON 형식으로 상세 리포트를 작성해주세요:
      {
        "itemName": "식별된 정확한 모델명",
        "category": "상기 분류 중 하나",
        "conditionScore": 1~10 사이 점수 (흠집이 하나라도 보이면 7점 이하로 책정),
        "marketDemand": "유럽 내 수요 (High/Medium/Low)",
        "priceRange": { "min": 보수적 최소유로, "max": 현실적 최대유로 },
        "insights": ["감가 요인 상세 분석", "유럽 내 실제 거래 데이터 기반 분석"],
        "reasoning": "왜 이 가격인가? (어떤 흠집 때문에 가격을 깎았는지 구체적으로 명시)"
      }
      반드시 한국어로 작성하세요.`;

      addFeed(t('post.aiComparingMsg'));
      Animated.timing(progressAnim, { toValue: 85, duration: 3000, useNativeDriver: false }).start();

      const result = await model.generateContent([prompt, ...imageParts]);
      const aiResponse = await result.response;
      const responseText = aiResponse.text();

      setAiStep('finalizing');
      Animated.timing(progressAnim, { toValue: 100, duration: 800, useNativeDriver: false }).start();
      addFeed(t('post.aiPackagingMsg'));

      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        if (data) {
          setTitle(data.itemName || ''); // Notice: itemName used in prompt but title in form
          setAiPriceRange(data.priceRange || null);
          // Only set category if AI return is meaningful
          if (data.category) {
            setCategory(data.category);
          }
          setDescription(data.reasoning || data.description || '');
          setCondition('Good');
        } else {
          setTitle(t('post.aiAnalysisCompleted'));
          setDescription(responseText);
        }

        await addDoc(collection(db, 'ai_processing_logs'), {
          image: downloadURL,
          aiResult: data || responseText,
          status: 'completed',
          createdAt: new Date(),
        });

      } catch (e) {
        console.warn('Failed to parse AI JSON:', e);
        setTitle(t('post.aiAnalysisFailed'));
        setDescription(t('post.aiAnalysisFailedMsg'));
      }

      setTimeout(() => {
        setIsAiLoading(false);
        setAiStep(null);
      }, 1000);

    } catch (error: any) {
      console.error('AI Analysis failed:', error);
      setIsAiLoading(false);
      setAiStep(null);

      const errorMessage = error?.message || t('common.unknownError');
      Alert.alert(t('post.aiAnalysisError') + (errorMessage.includes('API_NOT_ENABLED') ? t('post.apiNotEnabled') : ''),
        `${t('post.aiAnalysisProblem')}: ${errorMessage}\n\n${t('post.checkFirebaseAIAPI')}`);
    }
  };

  const renderAiLoadingOverlay = () => {
    if (!isAiLoading) return null;

    const getStepMessage = () => {
      switch (aiStep) {
        case 'uploading':
          return t('post.aiStepUploading');
        case 'analyzing':
          return t('post.aiStepAnalyzing');
        case 'finalizing':
          return t('post.aiStepFinalizing');
        default:
          return t('post.aiAnalyzing');
      }
    };

    return (
      <View style={styles.loadingOverlay}>
        <View style={styles.scanningWrap}>
          {photos.length > 0 && (
            <View style={styles.scanningPreviewBox}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={{ width: '100%', height: '100%' }}
                contentContainerStyle={{ alignItems: 'center' }}
              >
                {photos.map((p, i) => (
                  <View key={i} style={{ width: 280, height: 220, marginRight: 0 }}>
                    <Image source={{ uri: p }} style={styles.scanningPreviewImg} resizeMode="cover" />
                  </View>
                ))}
              </ScrollView>

              <Animated.View
                style={[
                  styles.scannerLine,
                  {
                    transform: [{
                      translateY: scannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 220],
                      })
                    }]
                  }
                ]}
              />
              <View style={styles.scanningOverlayTint} />

              {/* Slide Indicators */}
              <View style={{ position: 'absolute', bottom: 10, flexDirection: 'row', gap: 6, alignSelf: 'center' }}>
                {photos.map((_, i) => (
                  <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#30e86e', opacity: 0.8 }} />
                ))}
              </View>
            </View>
          )}

          <View style={styles.aiLiveContent}>
            <View style={styles.aiHeaderRow}>
              <View style={styles.aiPulseContainer}>
                <View style={styles.aiPulse} />
              </View>
              <Text style={styles.aiLiveTitle}>ADON VISION ENGINE</Text>
              <View style={styles.percentageBadge}>
                <Text style={styles.percentageText}>{displayProgress}%</Text>
              </View>
            </View>

            <View style={styles.liveFeedContainer}>
              <View style={styles.feedScroll}>
                {aiLiveFeed.map((msg, i) => (
                  <View key={i} style={styles.feedRow}>
                    <Text style={styles.feedArrow}>{'>'}</Text>
                    <Text style={[styles.feedItem, i === aiLiveFeed.length - 1 && styles.feedItemActive]}>
                      {msg}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressBarBg}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      })
                    }
                  ]}
                />
                <Animated.View
                  style={[
                    styles.progressGlow,
                    {
                      left: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      })
                    }
                  ]}
                />
              </View>
            </View>
            <Text style={styles.overlayStepMessage}>{getStepMessage().toUpperCase()}</Text>
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
          <Text style={styles.headerTitle}>{t('post.header')}</Text>
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
              <Text style={styles.aiBannerTitle}>{t('post.aiBannerTitle')}</Text>
              <Text style={styles.aiBannerSubtitle}>{t('post.aiBannerSubtitle')}</Text>
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
            <Text style={styles.sectionTitle}>{t('post.photos')}</Text>
            {isAiLoading && (
              <View style={styles.aiLoadingBadge}>
                <MaterialIcons name="auto-awesome" size={14} color="#16a34a" />
                <Text style={styles.aiLoadingText}>{t('post.aiAnalyzing')}</Text>
              </View>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
            <Pressable style={styles.addPhotoBtn} onPress={pickImage}>
              <MaterialIcons name="add-a-photo" size={24} color="#19e61b" />
              <Text style={styles.addPhotoText}>{t('post.addPhoto')} ({photos.length}/10)</Text>
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
            <Text style={styles.label}>{t('post.productName')}</Text>
            <TextInput
              style={styles.input}
              placeholder="예: Nike Air Max 97"
              placeholderTextColor="#64748b"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Category Selector (Mock) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('post.category')}</Text>
            <Pressable style={styles.selector} onPress={() => navigation.navigate('CategorySelect')}>
              <Text style={[styles.selectorText, !category && styles.placeholderText]}>
                {category || t('post.selectCategory')}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color="#94a3b8" />
            </Pressable>
          </View>

          {/* Price Input */}
          <View style={styles.inputGroup}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.label}>{t('post.price')}</Text>
              <Pressable
                style={styles.aiPriceBtn}
                onPress={() => {
                  if (photos.length > 0) {
                    navigation.navigate('AiPriceAssistant', { imageUris: photos, initialPrice: price });
                  } else {
                    Alert.alert(t('post.pleaseAddPhotoFirst'), t('post.addPhotoFirstMsg'));
                  }
                }}
              >
                <MaterialIcons name="auto-awesome" size={16} color="#30e86e" />
                <Text style={styles.aiPriceBtnText}>
                  {aiPriceRange ? t('post.aiPriceRange', { min: aiPriceRange.min, max: aiPriceRange.max }) : t('post.aiPriceBtn')}
                </Text>
              </Pressable>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.currencySymbol}>€</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          {/* Condition Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('post.condition')}</Text>
            <View style={styles.conditionRow}>
              {conditions.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.conditionChip, condition === c && styles.conditionChipActive]}
                  onPress={() => setCondition(c)}
                >
                  <Text style={[styles.conditionText, condition === c && styles.conditionTextActive]}>
                    {conditionLabelMap[c]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('post.description')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="상품 설명을 입력해 주세요."
              placeholderTextColor="#64748b"
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

        </ScrollView>

        {/* Footer / CTA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={[styles.ctaBtn, isPosting && styles.ctaBtnDisabled]}
            onPress={handlePostItem}
            disabled={isPosting}
          >
            <Text style={styles.ctaText}>{isPosting ? t('post.posting') : t('post.submit')}</Text>
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
    fontSize: 11,
    fontWeight: '700',
    color: '#19e61b',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 4,
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
  ctaBtnDisabled: {
    opacity: 0.65,
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Bright background
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningWrap: {
    width: '85%',
    alignItems: 'center',
  },
  scanningPreviewBox: {
    width: 280,
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#30e86e',
    backgroundColor: '#fff',
    shadowColor: '#30e86e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  scanningPreviewImg: {
    width: 280,
    height: 220,
  },
  scannerLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#30e86e',
    shadowColor: '#30e86e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10,
  },
  scanningOverlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(48, 232, 110, 0.1)', // Light green tint
  },
  aiLiveContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  aiPulseContainer: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#30e86e',
  },
  aiLiveTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a', // Dark text for contrast
    letterSpacing: 1,
    flex: 1,
    marginLeft: 12,
  },
  percentageBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30e86e',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16a34a',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  liveFeedContainer: {
    height: 130,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  feedScroll: {
    flex: 1,
  },
  feedRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  feedArrow: {
    fontSize: 12,
    color: '#30e86e',
    marginRight: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  feedItem: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  feedItemActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#30e86e',
    borderRadius: 4,
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  overlayStepMessage: {
    fontSize: 12,
    fontWeight: '700',
    color: '#30e86e',
    textAlign: 'center',
    letterSpacing: 1,
    opacity: 1,
  },
  aiPriceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiPriceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#30e86e',
  },
});
