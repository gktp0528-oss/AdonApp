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
import type { ListingCondition } from '../types/listing';

type Props = NativeStackScreenProps<RootStackParamList, 'AiListing'>;

type UnifiedAiReport = {
  itemName: string;
  marketDemand: string;
  conditionScore: number | null;
  priceRange: { min: number; max: number } | null;
  insights: string[];
  reasoning: string;
};

export function AiListingScreen({ navigation, route }: Props) {
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

  useEffect(() => {
    if (route.params?.appliedReport) {
      const data = route.params.appliedReport;
      if (data.itemName) setTitle(data.itemName);
      if (data.priceRange) {
        setAiPriceRange(data.priceRange);
        const suggested = getRecommendedPriceFromRange(data.priceRange);
        if (suggested) setPrice(suggested);
      }
      if (data.conditionScore) {
        setCondition(inferConditionFromScore(data.conditionScore));
      }
      if (data.reasoning) setDescription(data.reasoning);

      setAiReport(data);
    }
  }, [route.params?.appliedReport]);

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
  const [aiReport, setAiReport] = useState<UnifiedAiReport | null>(null);

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
    New: '새 상품',
    'Like New': '거의 새것',
    Good: '양호',
    Fair: '사용감 있음',
  };

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
        // Optional fields can be added here
      });

      Alert.alert('등록 완료', '상품이 정상적으로 등록되었어요.', [
        {
          text: '확인',
          onPress: () => resetToTab(navigation, getPostExitTab(), 'post'),
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

    addFeed('⚡️ Adon Vision Engine 초기화 완료');
    addFeed('📤 사진 데이터 클라우드 업로드 중...');

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
      addFeed('🧠 Adon Vision 하이엔드 식별 엔진 가동...');
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

      addFeed('🌍 유럽 시장 시세 및 명품 트렌드 DB 대조...');
      Animated.timing(progressAnim, { toValue: 85, duration: 3000, useNativeDriver: false }).start();

      const result = await model.generateContent([prompt, ...imageParts]);
      const aiResponse = await result.response;
      const responseText = aiResponse.text();

      setAiStep('finalizing');
      Animated.timing(progressAnim, { toValue: 100, duration: 800, useNativeDriver: false }).start();
      addFeed('✨ 최적의 리스팅 데이터 패키징 완료!');

      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
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
          if (typeof desc === 'string') {
            setDescription(desc.trim());
          }

          const report: UnifiedAiReport = {
            itemName: typeof data.itemName === 'string' && data.itemName.trim() ? data.itemName.trim() : '분석 상품',
            marketDemand: typeof data.marketDemand === 'string' && data.marketDemand.trim() ? data.marketDemand.trim() : 'N/A',
            conditionScore: normalizedScore,
            priceRange: normalizedPriceRange,
            insights: normalizedInsights,
            reasoning: typeof desc === 'string' && desc.trim() ? desc.trim() : '리포트 설명이 제공되지 않았습니다.',
          };

          setIsAiLoading(false);
          setAiStep(null);

          navigation.navigate('AiAnalysisResult', {
            report,
            imageUri: photos[0]
          });

        } else {
          // Fallback for failed JSON parse
          Alert.alert('Analysis Failed', 'Could not structure the data.');
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

  if (isAiLoading) {
    return (
      <View style={styles.loadingOverlay}>
        <View style={styles.scanningWrap}>
          <View style={styles.aiPulseContainer}>
            <View style={styles.aiPulse} />
          </View>
          <Text style={styles.aiLiveTitle}>ADON VISION ENGINE</Text>
          <Text style={styles.percentageText}>{aiStep === 'uploading' ? 'UPLOADING...' : 'ANALYZING...'}</Text>
        </View>
      </View>
    );
  }

  const renderAiLoadingOverlay = () => {
    if (!isAiLoading) return null;

    const getStepMessage = () => {
      switch (aiStep) {
        case 'uploading':
          return '1단계: 사진 업로드 및 정보 스캔 중';
        case 'analyzing':
          return '1단계: 사진 업로드 및 정보 스캔 중';
        case 'finalizing':
          return '2단계: 시세 계산과 등록 문구 정리 중';
        default:
          return 'AI 분석 준비 중';
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
          <Text style={styles.headerTitle}>새 상품 등록</Text>
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
              <Text style={styles.aiBannerTitle}>Adon AI 기능 사용해보기</Text>
              <Text style={styles.aiBannerSubtitle}>자동 입력, 시세 분석 등</Text>
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
            <Text style={styles.sectionTitle}>사진</Text>
            {isAiLoading && (
              <View style={styles.aiLoadingBadge}>
                <MaterialIcons name="auto-awesome" size={14} color="#16a34a" />
                <Text style={styles.aiLoadingText}>AI 분석 중...</Text>
              </View>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
            <Pressable style={styles.addPhotoBtn} onPress={pickImage}>
              <MaterialIcons name="add-a-photo" size={24} color="#19e61b" />
              <Text style={styles.addPhotoText}>사진 추가 ({photos.length}/10)</Text>
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
            <Text style={styles.label}>상품명</Text>
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
            <Text style={styles.label}>카테고리</Text>
            <Pressable style={styles.selector} onPress={() => navigation.navigate('CategorySelect')}>
              <Text style={[styles.selectorText, !category && styles.placeholderText]}>
                {category || '카테고리 선택'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={24} color="#94a3b8" />
            </Pressable>
          </View>

          {/* Price Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>가격</Text>
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

          {aiReport ? (
            <View style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportTitle}>Adon AI 통합 리포트</Text>
                <Text style={styles.reportSubtitle}>상품 분석 + 가격 제안 + 판매 문구를 한 번에 정리했어요</Text>
              </View>

              <View style={styles.reportStatRow}>
                <View style={styles.reportPill}>
                  <Text style={styles.reportPillLabel}>모델</Text>
                  <Text style={styles.reportPillValue}>{aiReport.itemName}</Text>
                </View>
                <View style={styles.reportPill}>
                  <Text style={styles.reportPillLabel}>수요</Text>
                  <Text style={styles.reportPillValue}>{aiReport.marketDemand}</Text>
                </View>
              </View>

              <View style={styles.reportStatRow}>
                <View style={styles.reportPill}>
                  <Text style={styles.reportPillLabel}>상태 점수</Text>
                  <Text style={styles.reportPillValue}>
                    {aiReport.conditionScore !== null ? `${aiReport.conditionScore}/10` : 'N/A'}
                  </Text>
                </View>
                <View style={styles.reportPill}>
                  <Text style={styles.reportPillLabel}>권장 가격</Text>
                  <Text style={styles.reportPillValue}>
                    {aiReport.priceRange ? `€${aiReport.priceRange.min} ~ €${aiReport.priceRange.max}` : 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.reportBody}>
                <Text style={styles.reportSectionTitle}>판매 근거 요약</Text>
                <Text style={styles.reportReasoning}>{aiReport.reasoning}</Text>
              </View>

              {aiReport.insights.length > 0 ? (
                <View style={styles.reportBody}>
                  <Text style={styles.reportSectionTitle}>핵심 인사이트</Text>
                  {aiReport.insights.map((insight, idx) => (
                    <View key={`${insight}-${idx}`} style={styles.reportInsightRow}>
                      <MaterialIcons name="check-circle" size={14} color="#16a34a" />
                      <Text style={styles.reportInsightText}>{insight}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <Pressable
                style={[styles.reportApplyBtn, !aiPriceRange && styles.reportApplyBtnDisabled]}
                onPress={handleApplyRecommendedPrice}
                disabled={!aiPriceRange}
              >
                <Text style={styles.reportApplyBtnText}>추천 가격 입력하기</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Condition Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>상태</Text>
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
            <Text style={styles.label}>설명</Text>
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
            <Text style={styles.ctaText}>{isPosting ? '등록 중...' : '상품 등록하기'}</Text>
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
});
