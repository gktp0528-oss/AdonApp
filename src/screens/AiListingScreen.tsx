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
  InteractionManager,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { ConditionSlider } from '../components/ConditionSlider';

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
import { storage, db } from '../firebaseConfig';
import { aiListingService } from '../services/aiListingService';



import { listingService } from '../services/listingService';
import { userService } from '../services/userService';
import { ListingCondition, UnifiedAiReport } from '../types/listing';
import { useTranslation } from 'react-i18next';
import { LocationPicker } from '../components/LocationPicker';
import { aiBridge } from '../services/aiBridge';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'AiListing'>;

export function AiListingScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for the native transition to finish before rendering heavy content
    const task = InteractionManager.runAfterInteractions(() => {
      // Add a tiny extra delay for psychological smoothness
      setTimeout(() => {
        setIsReady(true);
      }, 50);
    });

    return () => task.cancel();
  }, []);

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
      setPrice(formatNumberWithCommas(route.params.selectedPrice));
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
    navigation.goBack();
  };

  // Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<ListingCondition>(100); // Default to 100% (new)
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]); // Array of image URIs
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postStep, setPostStep] = useState<'uploading' | 'listing' | 'finalizing' | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [aiStep, setAiStep] = useState<'uploading' | 'analyzing' | 'finalizing' | null>(null);
  const [aiPriceRange, setAiPriceRange] = useState<{ min: number, max: number } | null>(null);
  const [aiReport, setAiReport] = useState<UnifiedAiReport | null>(null);
  const [pickupLocation, setPickupLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);


  // Removed: conditions and conditionLabelMap (now using slider 0-100)

  const [isSliderInteracting, setIsSliderInteracting] = useState(false);
  const scrollRef = React.useRef<ScrollView>(null);

  const handleInputFocus = (offset: number) => {
    // Add a slight delay to ensure keyboard is active and layout updated
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: offset,
        animated: true,
      });
    }, 150);
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

  const formatNumberWithCommas = (value: string) => {
    // Remove all non-digits
    const numericValue = value.replace(/[^0-9]/g, '');
    // Add commas every 3 digits
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handlePriceChange = (text: string) => {
    const formatted = formatNumberWithCommas(text);
    setPrice(formatted);
  };

  const getRecommendedPriceFromRange = (range: { min: number; max: number } | null): string | null => {
    if (!range) return null;
    const min = Number(range.min);
    const max = Number(range.max);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) return null;
    const rounded = Math.round((min + max) / 2);
    return formatNumberWithCommas(String(rounded));
  };

  const inferConditionFromScore = (score: number | null): ListingCondition => {
    if (score === null) return 60; // Default to 60%
    return Math.round(score * 10); // Convert 1-10 score to 10-100%
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

    // Ensure AI loading is cleared to prevent UI overlap
    setIsAiLoading(false);
    setAiStep(null);

    const normalizedTitle = title.trim();
    const normalizedCategory = category.trim();
    const normalizedDescription = description.trim();
    const normalizedPrice = Number(price.replace(/,/g, ''));

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
    setPostStep('uploading');
    try {
      // Helper: create blob from local URI (React Native compatible)
      const uriToBlob = (uri: string): Promise<Blob> => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = () => resolve(xhr.response as Blob);
          xhr.onerror = (e) => reject(new Error(`Blob conversion failed: ${e}`));
          xhr.responseType = 'blob';
          xhr.open('GET', uri, true);
          xhr.send(null);
        });
      };

      // Upload with per-file timeout to prevent infinite hangs
      const uploadWithTimeout = async (uri: string, index: number): Promise<string> => {
        if (uri.startsWith('http')) return uri;

        const UPLOAD_TIMEOUT = 60000; // 60 seconds per file
        return new Promise<string>(async (resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error(`Photo ${index + 1} upload timed out after 30s`));
          }, UPLOAD_TIMEOUT);

          try {
            const filename = uri.split('/').pop() || `listing_${index}.jpg`;
            const storagePath = `listings/photos/${Date.now()}_${index}_${filename}`;
            const storageRef = ref(storage, storagePath);
            console.log(`[Upload] Starting photo ${index + 1}: ${storagePath}`);

            const blob = await uriToBlob(uri);
            console.log(`[Upload] Blob created for photo ${index + 1}, size: ${blob.size}`);

            await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
            console.log(`[Upload] Photo ${index + 1} uploaded successfully`);

            const downloadUrl = await getDownloadURL(storageRef);
            clearTimeout(timer);
            resolve(downloadUrl);
          } catch (err) {
            clearTimeout(timer);
            reject(err);
          }
        });
      };

      const uploadedPhotos = await Promise.all(
        photos.map((uri, index) => uploadWithTimeout(uri, index))
      );

      setPostStep('listing');

      // CRITICAL FIX: Ensure we have the latest UID from auth, not just the state
      const currentUid = userService.getCurrentUserId();
      const finalSellerId = currentUid || sellerId;

      console.log('--- POSTING DATA ---');
      console.log('Title:', normalizedTitle);
      console.log('Price:', normalizedPrice);
      console.log('Category:', normalizedCategory);
      console.log('SellerId (from auth):', currentUid);
      console.log('SellerId (from state):', sellerId);
      console.log('Condition:', condition);
      console.log('Photos Count:', uploadedPhotos.length);
      console.log('--------------------');

      if (!finalSellerId) {
        throw new Error('사용자 인증 정보가 없습니다. 다시 로그인해 주세요.');
      }

      await listingService.createListing({
        title: normalizedTitle,
        price: normalizedPrice,
        category: normalizedCategory,
        condition,
        description: normalizedDescription,
        photos: uploadedPhotos,
        currency: 'HUF', // Default to HUF for Hungary market
        status: 'active',
        sellerId: finalSellerId,
        pickupLocation: pickupLocation || undefined,
      });

      setPostStep('finalizing');
      // Give time for the user to see the success state
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(t('screen.aiListing.alert.successTitle') || '등록 완료', t('screen.aiListing.alert.successMsg') || '상품이 정상적으로 등록되었어요.', [
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
      setPostStep(null);
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
      exif: false, // Strip EXIF data
    });

    if (!result.canceled) {
      // Convert all images to JPEG format to avoid HEIC upload issues
      const convertedUris = await Promise.all(
        result.assets.map(async (asset) => {
          try {
            const manipResult = await ImageManipulator.manipulateAsync(
              asset.uri,
              [], // No transformations, just format conversion
              { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );
            console.log(`[ImagePicker] Converted ${asset.uri} to JPEG: ${manipResult.uri}`);
            return manipResult.uri;
          } catch (err) {
            console.warn(`[ImagePicker] Failed to convert ${asset.uri}, using original:`, err);
            return asset.uri;
          }
        })
      );
      const combinedPhotos = [...photos, ...convertedUris];
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
        [{ resize: { width: 1024 } }], // Increased resolution to 1024px for better OCR/Identification
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // Slightly higher quality
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
      // Optimize images
      const uris = await Promise.all(originalUris.map(uri => aiListingService.processImage(uri)));

      const primaryUri = uris[0];
      const filename = primaryUri.split('/').pop();
      const storagePath = `listings/ai_logs/${Date.now()}_${filename}`;
      const storageRef = ref(storage, storagePath);

      // Use XMLHttpRequest for blob (React Native compatible)
      const aiBlob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response as Blob);
        xhr.onerror = (e) => reject(new Error(`AI log blob conversion failed: ${e}`));
        xhr.responseType = 'blob';
        xhr.open('GET', primaryUri, true);
        xhr.send(null);
      });
      await uploadBytes(storageRef, aiBlob, { contentType: 'image/jpeg' });
      const downloadURL = await getDownloadURL(storageRef);

      setAiStep('analyzing');

      const languageMap: Record<string, string> = {
        ko: '한국어 (Korean)',
        en: 'English',
        hu: 'Magyar (Hungarian)'
      };
      const targetLang = languageMap[i18n.language] || 'English';

      const report = await aiListingService.analyzeListing(uris, targetLang);

      if (report) {
        setAiStep('finalizing');
        setTitle(report.itemName);
        setAiPriceRange(report.priceRange);
        setCategory(report.category);

        await new Promise(resolve => setTimeout(resolve, 1500));

        navigation.navigate('AiAnalysisResult', {
          report,
          imageUri: photos[0]
        });

        setTimeout(() => {
          setIsAiLoading(false);
          setAiStep(null);
        }, 500);

        await addDoc(collection(db, 'ai_processing_logs'), {
          image: downloadURL,
          aiResult: report,
          status: 'completed',
          createdAt: new Date(),
        });
      } else {
        throw new Error('Analysis result is empty');
      }

    } catch (e) {
      console.warn('AI analysis error:', e);
      Alert.alert('AI 분석 실패', '분석 중 문제가 발생했습니다.');
      setIsAiLoading(false);
      setAiStep(null);
    }
  };

  if (!isReady) {
    return <PostSkeleton />;
  }

  if (isAiLoading) {
    return <AiLoadingOverlay step={aiStep} />;
  }

  if (isPosting && postStep) {
    return <PostLoadingOverlay step={postStep} />;
  }

  return (
    <View style={styles.root}>
      <View style={{ flex: 1 }}>
        <AdonHeader
          title={t('screen.listing.title')}
          showClose={true}
          onClose={handleClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView
            ref={scrollRef}
            scrollEnabled={!isSliderInteracting}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: 120 + insets.bottom },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
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
            {/* Photo Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('screen.aiListing.section.photos')}</Text>
              {isAiLoading && (
                <View style={styles.aiLoadingBadge}>
                  <MaterialIcons name="auto-awesome" size={14} color="#16a34a" />
                  <Text style={styles.aiLoadingText}>{t('screen.aiListing.analyzing')}</Text>
                </View>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photoScroll}
              contentContainerStyle={styles.photoScrollContent}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled={true}
            >
              <Pressable style={styles.addPhotoBtn} onPress={pickImage}>
                <View style={styles.addPhotoIconWrapper}>
                  <MaterialIcons name="add-a-photo" size={28} color="#16a34a" />
                </View>
                <Text style={styles.addPhotoText}>({photos.length}/10)</Text>
              </Pressable>
              {photos.map((uri, index) => (
                <View key={index} style={styles.photoCard}>
                  <Image source={{ uri }} style={styles.photoImage} />
                  {index === 0 && (
                    <View style={styles.mainPhotoBadge}>
                      <Text style={styles.mainPhotoBadgeText}>{t('common.main') || 'Main'}</Text>
                    </View>
                  )}
                  <Pressable
                    style={styles.removePhotoBtn}
                    onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
                  >
                    <MaterialIcons name="close" size={12} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            {photos.length > 0 && !aiReport && (
              <View style={styles.aiActionRow}>
                <Pressable
                  style={[styles.aiAnalyzeBtn, isAiLoading && styles.aiAnalyzeBtnDisabled]}
                  onPress={handleRunAiAnalysis}
                  disabled={isAiLoading}
                >
                  <MaterialIcons
                    name="auto-awesome"
                    size={20}
                    color={isAiLoading ? '#94a3b8' : '#16a34a'}
                  />
                  <Text style={[styles.aiAnalyzeBtnText, isAiLoading && styles.aiAnalyzeBtnTextDisabled]}>
                    {t('screen.aiListing.generateReport')}
                  </Text>
                </Pressable>
                <Text style={styles.aiStepHint}>{t('screen.aiListing.stepHint')}</Text>
              </View>
            )}

            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('screen.aiListing.label.title')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('screen.aiListing.placeholder.title')}
                placeholderTextColor="#64748b"
                value={title}
                onChangeText={setTitle}
                onFocus={() => handleInputFocus(220)}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('screen.aiListing.label.category')}</Text>
              <Pressable
                style={styles.selector}
                onPress={() => {
                  Keyboard.dismiss();
                  navigation.push('CategorySelect');
                }}
              >
                <Text
                  style={[styles.selectorText, !category && styles.placeholderText]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {category || t('screen.categorySelect.title')}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={24} color="#94a3b8" />
              </Pressable>
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
                onFocus={() => handleInputFocus(400)}
              />
            </View>

            {/* Price Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('screen.aiListing.label.price')}</Text>
              <View style={styles.priceContainer}>
                <TextInput
                  style={styles.priceInput}
                  placeholder={t('screen.aiListing.placeholder.price')}
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={handlePriceChange}
                  maxLength={13} // Account for commas (10 digits + 3 commas)
                  onFocus={() => handleInputFocus(550)}
                />
                <View style={styles.currencyBadge}>
                  <Text style={styles.currencyBadgeText}>Ft</Text>
                </View>
              </View>
            </View>

            {/* Condition Slider */}
            <View style={styles.inputGroup}>
              <ConditionSlider
                value={condition}
                onValueChange={setCondition}
                onInteractionChange={setIsSliderInteracting}
              />
            </View>

            {/* Location Picker */}
            <LocationPicker onLocationChange={setPickupLocation} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer / CTA - Always fixed at bottom of screen */}
        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: '#f6f8f6',
            }
          ]}
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
      </View>
    </View>
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

// -------------------------------------------------------------------------
// NEW POST LOADING OVERLAY COMPONENT
// -------------------------------------------------------------------------

function PostLoadingOverlay({ step }: { step: 'uploading' | 'listing' | 'finalizing' }) {
  const { t } = useTranslation();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const titleFade = React.useRef(new Animated.Value(0)).current;
  const flashAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    if (step === 'finalizing') {
      Animated.sequence([
        Animated.delay(800),
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
    Animated.timing(titleFade, {
      toValue: 1,
      duration: 800,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const flashScale = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
  });

  const flashOpacity = flashAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0, 1, 1],
  });

  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.scanningWrap}>
        <View style={{ height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          {step === 'uploading' && <PostUploadingIcon />}
          {step === 'listing' && <PostListingIcon />}
          {step === 'finalizing' && <PostFinalizingIcon />}
        </View>

        <Animated.Text style={[styles.aiLiveTitle, { opacity: titleFade, textAlign: 'center', marginLeft: 0, color: '#16a34a' }]}>
          {t('screen.aiListing.postStatus.overlayTitle')}
        </Animated.Text>

        <Animated.Text style={[styles.percentageText, { opacity: fadeAnim, marginTop: 10, color: '#15803d' }]}>
          {t(`screen.aiListing.postStatus.${step}`)}
        </Animated.Text>
      </View>

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

function PostUploadingIcon() {
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
      <MaterialIcons name="cloud-upload" size={72} color="#19e61b" />
    </Animated.View>
  );
}

function PostListingIcon() {
  const scale = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <MaterialIcons name="inventory" size={72} color="#19e61b" />
    </Animated.View>
  );
}

function PostFinalizingIcon() {
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
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#19e61b',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <MaterialIcons name="check" size={56} color="#fff" />
      </View>
    </Animated.View>
  );
}

// -------------------------------------------------------------------------
// NEW POST SKELETON COMPONENT (Premium Vinted/Bunjang Style)
// -------------------------------------------------------------------------
function SkeletonItem({ width, height, borderRadius = 8, marginBottom = 16, style }: any) {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150], // Adjust based on common widths
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          marginBottom,
          backgroundColor: '#eff6ff', // Light blue-ish gray
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.6)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

function PostSkeleton() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <View style={styles.skeletonContainer}>
      <AdonHeader title={t('screen.listing.title')} showClose={true} onClose={() => { }} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Section Skeleton */}
        <SkeletonItem width={120} height={20} marginBottom={16} />
        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
          <SkeletonItem width={100} height={100} borderRadius={16} style={{ marginRight: 12 }} />
          <SkeletonItem width={100} height={100} borderRadius={16} style={{ marginRight: 12 }} />
          <SkeletonItem width={100} height={100} borderRadius={16} />
        </View>

        {/* Form Fields Skeletons */}
        <View style={styles.inputGroup}>
          <SkeletonItem width={80} height={16} marginBottom={12} />
          <SkeletonItem width="100%" height={56} borderRadius={16} />
        </View>

        <View style={styles.inputGroup}>
          <SkeletonItem width={80} height={16} marginBottom={12} />
          <SkeletonItem width="100%" height={56} borderRadius={16} />
        </View>

        <View style={styles.inputGroup}>
          <SkeletonItem width={80} height={16} marginBottom={12} />
          <SkeletonItem width="100%" height={56} borderRadius={16} />
        </View>

        <View style={styles.inputGroup}>
          <SkeletonItem width="100%" height={80} borderRadius={16} />
        </View>

        <View style={styles.inputGroup}>
          <SkeletonItem width="100%" height={56} borderRadius={16} />
        </View>

        <View style={styles.inputGroup}>
          <SkeletonItem width={80} height={16} marginBottom={12} />
          <SkeletonItem width="100%" height={150} borderRadius={16} />
        </View>
      </ScrollView>

      {/* Footer Skeleton */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12), borderTopWidth: 1, backgroundColor: '#fff' }]}>
        <SkeletonItem width="100%" height={56} borderRadius={28} marginBottom={0} />
      </View>
    </View>
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
    paddingTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    marginBottom: 32,
    marginHorizontal: -20, // Negative margin to allow full-width scroll
  },
  photoScrollContent: {
    paddingHorizontal: 20, // Add padding back to content
    gap: 12,
  },
  addPhotoBtn: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  addPhotoIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
  },
  photoCard: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  mainPhotoBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(22, 163, 74, 0.9)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  mainPhotoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    top: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputGroup: {
    marginBottom: 24,
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
    fontSize: 14, // Slightly smaller to fit more of the path
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  placeholderText: {
    color: '#94a3b8',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingLeft: 20,
    paddingRight: 8,
    height: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  priceInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  currencyBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  currencyBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
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
    marginBottom: 28,
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
    color: '#166534', // Dark green for readability on light background
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
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});

export default AiListingScreen;
