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
  Keyboard,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  Easing,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { TabTransitionView } from '../components/TabTransitionView';
import { AdonHeader } from '../components/AdonHeader';

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getGenerativeModel } from "firebase/ai";
import { storage, db, aiBackend } from '../firebaseConfig';



import { listingService } from '../services/listingService';
import { userService } from '../services/userService';
import { ListingCondition, UnifiedAiReport } from '../types/listing';
import { useTranslation } from 'react-i18next';
import { LocationPicker } from '../components/LocationPicker';
import { aiBridge } from '../services/aiBridge';

type Props = NativeStackScreenProps<RootStackParamList, 'AiListing'>;

export function AiListingScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const slideUpAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Trigger fast slide up on mount
  useEffect(() => {
    Animated.timing(slideUpAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const { t, i18n } = useTranslation();

  // Temporary: get current seller ID
  const sellerId = userService.getCurrentUserId();

  useEffect(() => {
    console.log('AiListing params changed:', route.params);
    if (route.params?.selectedCategory) {
      console.log('Setting category from params:', route.params.selectedCategory);
      setCategory(route.params.selectedCategory);
      // Clear param after consumption to prevent re-triggering and ensure clean state
      navigation.setParams({ selectedCategory: undefined } as any);
    }
  }, [route.params?.selectedCategory, navigation]);

  useEffect(() => {
    if (route.params?.selectedPrice) {
      setPrice(route.params.selectedPrice);
      navigation.setParams({ selectedPrice: undefined } as any);
    }
  }, [route.params?.selectedPrice, navigation]);

  const applyAiReport = (data: UnifiedAiReport) => {
    if (data.itemName) setTitle(data.itemName);
    if (data.category) setCategory(data.category);
    if (data.priceRange) {
      setAiPriceRange(data.priceRange);
      const suggested = getRecommendedPriceFromRange(data.priceRange);
      if (suggested) setPrice(suggested);
    }
    if (data.conditionScore) {
      setCondition(inferConditionFromScore(data.conditionScore));
    }
    setAiReport(data);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const bridgeReport = aiBridge.popReport();
      if (bridgeReport) {
        applyAiReport(bridgeReport);
      }
    });

    // Also check on mount just in case
    const bridgeReport = aiBridge.popReport();
    if (bridgeReport) {
      applyAiReport(bridgeReport);
    }

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (route.params?.appliedReport) {
      applyAiReport(route.params.appliedReport);
      // Clear the param after applying to avoid re-triggering on future focus/renders
      navigation.setParams({ appliedReport: undefined } as any);
    }
  }, [route.params?.appliedReport]);

  const handleClose = () => {
    // Animate out before going back
    Animated.timing(slideUpAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [aiStep, setAiStep] = useState<'uploading' | 'analyzing' | 'finalizing' | null>(null);
  const [aiPriceRange, setAiPriceRange] = useState<{ min: number, max: number } | null>(null);
  const [aiReport, setAiReport] = useState<UnifiedAiReport | null>(null);
  const [pickupLocation, setPickupLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);


  const conditions: ListingCondition[] = ['New', 'Like New', 'Good', 'Fair'];
  const conditionLabelMap: Record<ListingCondition, string> = {
    New: '새 상품',
    'Like New': '거의 새것',
    Good: '양호',
    Fair: '사용감 있음',
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const getRecommendedPriceFromRange = (range: { min: number; max: number } | null): string | null => {
    if (!range) return null;
    const min = Number(range.min);
    const max = Number(range.max);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) return null;
    return String(Math.round((min + max) / 2));
  };

  const inferConditionFromScore = (score: number | null): ListingCondition => {
    if (score === null) return 'Good';
    if (score >= 9) return 'New';
    if (score >= 7) return 'Like New';
    if (score >= 4) return 'Good';
    return 'Fair';
  };

  const handleApplyRecommendedPrice = () => {
    const suggestedPrice = getRecommendedPriceFromRange(aiPriceRange);
    if (!suggestedPrice) {
      Alert.alert('추천 가격을 계산할 수 없어요.', '리포트를 한 번 더 분석해 주세요.');
      return;
    }
    setPrice(suggestedPrice);
  };

  const handlePostItem = async () => {
    if (isPosting) return;

    const normalizedTitle = title.trim();
    const normalizedCategory = category.trim();
    const normalizedDescription = description.trim();
    const normalizedPrice = Number(price.replace(',', '.'));

    if (!normalizedTitle) {
      Alert.alert('제목을 입력해 주세요.');
      return;
    }
    if (!normalizedCategory) {
      Alert.alert('카테고리를 선택해 주세요.');
      return;
    }
    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      Alert.alert('가격을 올바르게 입력해 주세요.');
      return;
    }
    if (!normalizedDescription) {
      Alert.alert('설명을 입력해 주세요.');
      return;
    }
    if (photos.length === 0) {
      Alert.alert('사진을 1장 이상 등록해 주세요.');
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
        pickupLocation: pickupLocation || undefined,
        // Optional fields can be added here
      });

      Alert.alert('등록 완료', '상품이 정상적으로 등록되었어요.', [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Post Item failed:', error);
      Alert.alert(
        '등록 실패',
        `글 등록 중 문제가 발생했어요: ${error?.message || '알 수 없는 에러'}`
      );
    } finally {
      setIsPosting(false);
    }
  };

  const pickImage = async () => {
    if (photos.length >= 10) {
      Alert.alert('사진은 최대 10장까지 등록할 수 있어요.');
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
    }
  };

  const handleRunAiAnalysis = () => {
    if (isAiLoading) return;
    if (photos.length === 0) {
      Alert.alert('사진을 먼저 등록해주세요!', 'AI 분석은 사진이 있어야 시작할 수 있어요. 📸');
      return;
    }
    analyzePhotosWithAi(photos);
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
    // Animated.timing(progressAnim, { toValue: 15, duration: 1000, useNativeDriver: false }).start(); // Removed

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

    // addFeed('⚡️ Adon Vision Engine 초기화 완료');
    // addFeed('📤 사진 데이터 클라우드 업로드 중...');

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

      // Animated.timing(progressAnim, { toValue: 40, duration: 1500, useNativeDriver: false }).start();
      setAiStep('analyzing');
      // addFeed('🧠 Adon Vision 하이엔드 식별 엔진 가동...');
      const model = getGenerativeModel(aiBackend, { model: "gemini-2.5-flash" });

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

      const languageMap: Record<string, string> = {
        ko: '한국어 (Korean)',
        en: 'English',
        hu: 'Magyar (Hungarian)'
      };
      const targetLang = languageMap[i18n.language] || 'English';

      const prompt = `당신은 유럽(독일, 프랑스, 스페인 등)의 중고 마켓(eBay, Vinted, Wallapop) 시세에 정통한 매우 보수적이고 객관적인 가격 책정 전문가입니다.
      
      [분석 지침]
      1. 제품의 정확한 모델명을 식별하세요.
      2. 사진에서 스크래치, 찍힘, 오염, 사용감 등 '감가 요인'을 이 잡듯 찾아내십시오. 
      3. 가격 책정 시 매우 보수적이어야 합니다. 조금이라도 흠집이 있다면 '최상의 상태' 시세보다 최소 20-30% 이상 낮은 가격을 제시하세요.
      4. 특히 에어팟 같은 소모품은 배터리 수명과 외관 스크래치가 가격에 치명적임을 반영하세요.
      5. 제품의 카테고리를 다음 중 하나로 반드시 분류하세요: fashion, tech, home, hobbies, sports, mobility.
      
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
      MUST be written in ${targetLang}. Response language should match exactly ${targetLang}.`;

      // addFeed('🌍 유럽 시장 시세 및 명품 트렌드 DB 대조...'); 
      // Animated.timing(progressAnim, { toValue: 85, duration: 3000, useNativeDriver: false }).start();

      const result = await model.generateContent([prompt, ...imageParts]);
      const aiResponse = await result.response;
      const responseText = aiResponse.text();

      console.log('🤖 AI Raw Response:', responseText);

      setAiStep('finalizing');
      // Animated.timing(progressAnim, { toValue: 100, duration: 800, useNativeDriver: false }).start();
      // addFeed('✨ 최적의 리스팅 데이터 패키징 완료!');

      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        console.log('🔍 JSON Match found:', jsonMatch ? 'Yes' : 'No');
        if (jsonMatch) {
          console.log('📝 Extracted JSON:', jsonMatch[0].substring(0, 200) + '...');
        }
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        if (data) {
          const parsedScore = Number(data.conditionScore);
          const normalizedScore = Number.isFinite(parsedScore) ? Math.max(1, Math.min(10, Math.round(parsedScore))) : null;
          const normalizedInsights = Array.isArray(data.insights)
            ? data.insights.filter((x: unknown) => typeof x === 'string' && x.trim()).slice(0, 4)
            : [];

          let normalizedPriceRange: { min: number; max: number } | null = null;
          if (data.priceRange && typeof data.priceRange.min === 'number' && typeof data.priceRange.max === 'number') {
            const min = Math.max(0, Math.round(data.priceRange.min));
            const max = Math.max(0, Math.round(data.priceRange.max));
            normalizedPriceRange = min <= max ? { min, max } : { min: max, max: min };
          }

          if (typeof data.itemName === 'string' && data.itemName.trim()) {
            setTitle(data.itemName.trim());
          } else {
            setTitle('AI 분석 상품');
          }

          setAiPriceRange(normalizedPriceRange);

          if (typeof data.category === 'string' && data.category.trim()) {
            setCategory(data.category.trim());
          }

          const desc = data.reasoning || data.description || '';

          const report: UnifiedAiReport = {
            itemName: typeof data.itemName === 'string' && data.itemName.trim() ? data.itemName.trim() : '분석 상품',
            category: typeof data.category === 'string' && data.category.trim() ? data.category.trim() : 'fashion',
            marketDemand: typeof data.marketDemand === 'string' && data.marketDemand.trim() ? data.marketDemand.trim() : 'N/A',
            conditionScore: normalizedScore,
            priceRange: normalizedPriceRange,
            insights: normalizedInsights,
            reasoning: typeof desc === 'string' && desc.trim() ? desc.trim() : '리포트 설명이 제공되지 않았습니다.',
          };

          // Add a small delay so user can actually see the 'Finalizing' checkmark (1.5s total)
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Navigate FIRST while overlay is still active
          navigation.navigate('AiAnalysisResult', {
            report,
            imageUri: photos[0]
          });

          // Delay cleanup for 500ms so the screen transition finishes before unmounting overlay
          setTimeout(() => {
            setIsAiLoading(false);
            setAiStep(null);
          }, 500);

        } else {
          // Fallback for failed JSON parse
          console.warn('❌ No valid JSON found in AI response');
          Alert.alert(
            'AI 분석 실패',
            'AI 응답을 파싱할 수 없습니다.\n\n응답 미리보기:\n' + responseText.substring(0, 150) + '...'
          );
          setIsAiLoading(false);
          setAiStep(null);
        }

        await addDoc(collection(db, 'ai_processing_logs'), {
          image: downloadURL,
          aiResult: data || responseText,
          status: 'completed',
          createdAt: new Date(),
        });
      } catch (e) {
        console.warn('Failed to parse AI JSON:', e);
        setTitle('AI 분석 실패');
        // Error fallback: just clear loading, don't write to description
        setIsAiLoading(false);
        setAiStep(null);
      }

    } catch (error: any) {
      console.error('AI Analysis failed:', error);
      setIsAiLoading(false);
      setAiStep(null);

      const errorMessage = error?.message || '알 수 없는 에러가 발생했어요.';
      Alert.alert('AI 분석 오류' + (errorMessage.includes('API_NOT_ENABLED') ? ' (API 미활성화)' : ''),
        `AI가 분석 중에 문제가 생겼어요: ${errorMessage}\n\nFirebase 콘솔에서 AI API가 활성화되어 있는지 확인해 주세요! 💖`);
    }
  };

  if (isAiLoading) {
    return <AiLoadingOverlay step={aiStep} />;
  }

  return (
    <Animated.View style={[styles.root, { transform: [{ translateY: slideUpAnim }] }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1 }}>
            <AdonHeader
              title={t('screen.listing.title')}
              showClose={true}
              onClose={handleClose}
            />

            <Pressable
              style={styles.aiBanner}
              onPress={() => navigation.navigate('AiIntro')}
            >
              <View style={styles.aiBannerContent}>
                <View style={styles.aiIconBadge}>
                  <MaterialIcons name="auto-awesome" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.aiBannerTitle}>{t('screen.aiListing.ad.title')}</Text>
                  <Text style={styles.aiBannerSubtitle}>{t('screen.aiListing.ad.subtitle')}</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#15803d" />
            </Pressable>

            <ScrollView
              contentContainerStyle={[
                styles.content,
                { paddingBottom: (isKeyboardVisible ? 56 : 100) + insets.bottom },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {/* Photo Section */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{t('screen.aiListing.section.photos')}</Text>
                {isAiLoading && (
                  <View style={styles.aiLoadingBadge}>
                    <MaterialIcons name="auto-awesome" size={14} color="#16a34a" />
                    <Text style={styles.aiLoadingText}>AI 분석 중...</Text>
                  </View>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.photoScroll}
                keyboardShouldPersistTaps="always"
              >
                <Pressable style={styles.addPhotoBtn} onPress={pickImage}>
                  <MaterialIcons name="add-a-photo" size={24} color="#19e61b" />
                  <Text style={styles.addPhotoText}>{t('screen.aiListing.section.photos')} + ({photos.length}/10)</Text>
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

              <View style={styles.aiActionRow}>
                <Pressable
                  style={[styles.aiAnalyzeBtn, (isAiLoading || photos.length === 0) && styles.aiAnalyzeBtnDisabled]}
                  onPress={handleRunAiAnalysis}
                  disabled={isAiLoading || photos.length === 0}
                >
                  <MaterialIcons name="auto-awesome" size={16} color={isAiLoading || photos.length === 0 ? '#94a3b8' : '#30e86e'} />
                  <Text style={[styles.aiAnalyzeBtnText, (isAiLoading || photos.length === 0) && styles.aiAnalyzeBtnTextDisabled]}>
                    {isAiLoading ? '통합 리포트 분석 중...' : aiPriceRange ? `AI 통합가: €${aiPriceRange.min} ~ €${aiPriceRange.max}` : 'AI 통합 리포트 생성'}
                  </Text>
                </Pressable>
                <Text style={styles.aiStepHint}>2단계 진행: 1) 사진 스캔 2) 시세/설명 생성</Text>
              </View>

              {/* Title Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('screen.aiListing.label.title')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('screen.aiListing.placeholder.title')}
                  placeholderTextColor="#64748b"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('screen.aiListing.label.category')}</Text>
                <Pressable
                  style={styles.selector}
                  onPress={() => {
                    console.log('Category selector pressed! Navigating to CategorySelect...');
                    Keyboard.dismiss();
                    navigation.push('CategorySelect');
                  }}
                >
                  <Text style={[styles.selectorText, !category && styles.placeholderText]}>
                    {category || t('screen.categorySelect.title')}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={24} color="#94a3b8" />
                </Pressable>
              </View>

              {/* Price Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('screen.aiListing.label.price')}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.currencySymbol}>€</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder={t('screen.aiListing.placeholder.price')}
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
              </View>


              {/* Condition Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('screen.aiListing.label.condition')}</Text>
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
                <Text style={styles.label}>{t('screen.aiListing.label.description')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder={t('screen.aiListing.placeholder.description')}
                  placeholderTextColor="#64748b"
                  multiline
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {/* Location Picker */}
              <LocationPicker onLocationChange={setPickupLocation} />

            </ScrollView>

            {/* Footer / CTA */}
            {!isKeyboardVisible && (
              <View
                style={[styles.footer, { bottom: 0, paddingBottom: Math.max(insets.bottom, 5) }]}
                pointerEvents="box-none"
              >
                <Pressable
                  style={[styles.ctaBtn, isPosting && styles.ctaBtnDisabled]}
                  onPress={handlePostItem}
                  disabled={isPosting}
                >
                  <Text style={styles.ctaText}>{isPosting ? t('screen.aiListing.uploading') : t('screen.aiListing.submit')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

// -------------------------------------------------------------------------
// NEW AI LOADING OVERLAY COMPONENT (Using Native Animated for compatibility)
// -------------------------------------------------------------------------

function AiLoadingOverlay({ step }: { step: 'uploading' | 'analyzing' | 'finalizing' | null }) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const titleFade = React.useRef(new Animated.Value(0)).current;
  const flashAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Fade in text on step change
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Trigger Flash when finalizing
    if (step === 'finalizing') {
      Animated.sequence([
        Animated.delay(1000), // Wait for checkmark pop
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [step]);

  React.useEffect(() => {
    // Title fade in once
    Animated.timing(titleFade, {
      toValue: 1,
      duration: 800,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const flashScale = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15], // Circle grows to cover screen
  });

  const flashOpacity = flashAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0, 1, 1],
  });

  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.scanningWrap}>
        {/* ICON AREA */}
        <View style={{ height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          {step === 'uploading' && <UploadingIcon />}
          {step === 'analyzing' && <AnalyzingIcon />}
          {step === 'finalizing' && <FinalizingIcon />}
        </View>

        {/* TEXT AREA */}
        <Animated.Text style={[styles.aiLiveTitle, { opacity: titleFade }]}>
          ADON VISION ENGINE
        </Animated.Text>

        <Animated.Text
          style={[styles.percentageText, { opacity: fadeAnim }]}
        >
          {step === 'uploading' && 'CLOUD UPLOADING...'}
          {step === 'analyzing' && 'DEEP ANALYZING...'}
          {step === 'finalizing' && 'COMPLETED!'}
        </Animated.Text>
      </View>

      {/* FLASH OVERLAY (Option 1) */}
      <Animated.View
        style={[
          styles.flashCircle,
          {
            transform: [{ scale: flashScale }],
            opacity: flashOpacity
          }
        ]}
      />
    </View>
  );
}

function UploadingIcon() {
  const y = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(y, {
          toValue: -15,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: y }] }}>
      <MaterialIcons name="cloud-upload" size={64} color="#30e86e" />
    </Animated.View>
  );
}

function AnalyzingIcon() {
  const rotate = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <MaterialIcons name="settings-suggest" size={64} color="#30e86e" />
    </Animated.View>
  );
}

function FinalizingIcon() {
  const scale = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <View style={{
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#30e86e',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <MaterialIcons name="check" size={48} color="#fff" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f8f6' },
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f8f6',
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
  aiActionRow: {
    marginTop: -10,
    marginBottom: 18,
  },
  aiAnalyzeBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  aiAnalyzeBtnDisabled: {
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  aiAnalyzeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  aiAnalyzeBtnTextDisabled: {
    color: '#94a3b8',
  },
  aiStepHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
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
    height: 200,
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
    zIndex: 1001, // Higher than BottomTabMock (1000) to stay on top
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
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dcfce7',
    padding: 16,
    marginBottom: 20,
  },
  reportHeader: {
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14532d',
  },
  reportSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  reportStatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  reportPill: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  reportPillLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 2,
  },
  reportPillValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  reportBody: {
    marginTop: 8,
  },
  reportSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  reportReasoning: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  reportInsightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  reportInsightText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  reportApplyBtn: {
    marginTop: 12,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportApplyBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  reportApplyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
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
  flashCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#30e86e',
    zIndex: 2000,
  },
});
