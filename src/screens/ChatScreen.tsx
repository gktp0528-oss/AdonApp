import React, { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import { DetailBackButton } from '../components/DetailBackButton';
import { chatService } from '../services/chatService';
import { userService } from '../services/userService';
import { Message, Conversation } from '../types/chat';
import { User } from '../types/user';
import { transactionService } from '../services/transactionService';
import { TransactionCompletion } from '../components/TransactionCompletion';
import { ReviewModal } from '../components/ReviewModal';
import { reviewService } from '../services/reviewService';
import { translationService } from '../services/translationService';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ navigation, route }: Props) {
  const { t, i18n } = useTranslation();
  const { conversationId } = route.params;
  const isFocused = useIsFocused();
  const currentUserId = userService.getCurrentUserId();
  const scrollRef = useRef<ScrollView>(null);
  const lastReadMessageIdRef = useRef('');
  const prevMessageLengthRef = useRef(0);

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [draft, setDraft] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [limit, setLimit] = useState(20);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [completedTransactionId, setCompletedTransactionId] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [hasReview, setHasReview] = useState(false);

  // Translation state
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingMessages, setTranslatingMessages] = useState<Record<string, boolean>>({});

  // Watch conversation metadata (single document)
  useEffect(() => {
    const unsub = chatService.watchConversationById(conversationId, (conv) => {
      setConversation(conv);
    });
    return () => unsub();
  }, [conversationId]);

  // Load other user's profile
  useEffect(() => {
    if (!conversation) return;
    const otherUserId = conversation.participants.find((p) => p !== currentUserId);
    if (!otherUserId) return;

    const unsub = userService.watchUserById(otherUserId, (user) => {
      setOtherUser(user);
    });
    return () => unsub();
  }, [conversation, currentUserId]);

  // Check for active transaction
  useEffect(() => {
    if (!conversation || !currentUserId) return;
    const otherUserId = conversation.participants.find((p) => p !== currentUserId);
    if (!otherUserId) return;

    const findTransaction = async () => {
      // We check both ways since either could be buyer/seller
      const tr = await transactionService.getTransactionsByChat(
        conversation.listingId,
        currentUserId,
        otherUserId
      ) || await transactionService.getTransactionsByChat(
        conversation.listingId,
        otherUserId,
        currentUserId
      );

      if (tr) {
        setActiveTransactionId(tr.id);
        setIsSeller(tr.sellerId === currentUserId);
        setHasReview(!!tr.reviewId);
      }
    };

    findTransaction();
  }, [conversation, currentUserId]);

  // Watch messages in real-time
  useEffect(() => {
    const unsub = chatService.watchMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setInitialLoading(false);
      setLoadingMore(false);
    }, limit);
    return () => unsub();
  }, [conversationId, limit]);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY <= 0 && messages.length >= limit && !initialLoading && !loadingMore) {
      setLoadingMore(true);
      setLimit(prev => prev + 20);
    }
  };

  // Mark as read whenever there is a new incoming last message while focused.
  useEffect(() => {
    if (!isFocused || !currentUserId || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.senderId === currentUserId) return;
    if (lastReadMessageIdRef.current === lastMessage.id) return;

    lastReadMessageIdRef.current = lastMessage.id;
    chatService.markAsRead(conversationId, currentUserId);
  }, [conversationId, currentUserId, isFocused, messages]);

  // Auto-scroll only for newly appended messages, not when loading older pages.
  useEffect(() => {
    const prevLen = prevMessageLengthRef.current;
    const nextLen = messages.length;
    const didGrow = nextLen > prevLen;
    prevMessageLengthRef.current = nextLen;

    if (!didGrow || loadingMore) return;
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length, loadingMore]);

  // Manual translate function
  const handleTranslate = async (msgId: string, text: string, senderLang: string) => {
    if (translatingMessages[msgId]) return;

    setTranslatingMessages(prev => ({ ...prev, [msgId]: true }));
    try {
      const translatedText = await translationService.getTranslation(
        conversationId,
        msgId,
        text,
        senderLang,
        i18n.language
      );

      if (translatedText) {
        setTranslations(prev => ({
          ...prev,
          [msgId]: translatedText
        }));
        setShowOriginal(prev => ({
          ...prev,
          [msgId]: false
        }));
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      if (error?.message === 'QUOTA_EXCEEDED') {
        Alert.alert(t('common.error'), t('screen.chat.error.quota', 'AI is busy. Please try again in 1 minute.'));
      } else {
        Alert.alert(t('common.error'), t('common.error'));
      }
    } finally {
      setTranslatingMessages(prev => {
        const { [msgId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    try {
      await chatService.sendMessage(conversationId, currentUserId, text);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0].uri) {
        setUploading(true);
        const uploadUrl = await uploadImage(result.assets[0].uri);
        await chatService.sendMessage(conversationId, currentUserId, '', uploadUrl);
        setUploading(false);
      }
    } catch (error) {
      console.error('Image selection failed', error);
      setUploading(false);
      Alert.alert(t('common.error'), t('screen.chat.error.image'));
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `chat/${conversationId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handleMorePress = () => {
    Alert.alert(
      t('screen.chat.menu.title', 'Chat Options'),
      undefined,
      [
        {
          text: t('screen.chat.menu.delete', 'Delete Chat'),
          onPress: () => {
            Alert.alert(
              t('screen.chat.menu.deleteConfirm.title', 'Delete Conversation'),
              t('screen.chat.menu.deleteConfirm.desc', 'Are you sure you want to delete this chat? This cannot be undone.'),
              [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.delete'), style: 'destructive', onPress: () => navigation.goBack() }]
            );
          },
          style: 'destructive'
        },
        {
          text: t('screen.chat.menu.report', 'Report User'),
          onPress: () => Alert.alert(t('common.success'), t('screen.chat.menu.reportSuccess', 'User has been reported.')),
        },
        { text: t('common.cancel'), style: 'cancel' }
      ]
    );
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#22c55e" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <View style={styles.userRow}>
            <DetailBackButton onPress={() => navigation.goBack()} plain />
            <Image
              source={{ uri: otherUser?.avatar || 'https://via.placeholder.com/100' }}
              style={styles.avatar}
            />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.user}>{otherUser?.name || t('screen.chat.status.loading')}</Text>
                {otherUser?.isVerified && (
                  <MaterialIcons name="verified-user" size={16} color="#16a34a" />
                )}
              </View>
            </View>
            <Pressable onPress={handleMorePress} style={styles.moreBtn} hitSlop={10}>
              <MaterialIcons name="more-vert" size={24} color="#6b7280" />
            </Pressable>
          </View>
        </View>

        {conversation && (
          <View style={styles.meetCard}>
            <View style={styles.meetIconCircle}>
              <MaterialIcons name="check" size={20} color="#22c55e" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.meetTitle}>{t('screen.chat.meet.title')}</Text>
              <Text style={styles.meetPlace}>{conversation.listingTitle || t('screen.chat.status.loading')}</Text>
            </View>
            <View style={styles.viewTrBtn}>
              <Text style={styles.viewTrBtnText}>{t('screen.chat.quick.location', 'Location')}</Text>
              <MaterialIcons name="chevron-right" size={14} color="#16a34a" />
            </View>
          </View>
        )}

        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {messages.length === 0 && (
            <Text style={styles.day}>{t('screen.chat.empty', 'Start your conversation!')}</Text>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;

            // Read receipt logic
            let isRead = false;
            if (isMe && conversation?.lastReadAt) {
              const otherUserId = conversation.participants.find(p => p !== currentUserId);
              if (otherUserId) {
                const otherLastReadAt = conversation.lastReadAt[otherUserId];
                if (otherLastReadAt && msg.createdAt) {
                  // Firebase Timestamp comparison
                  isRead = msg.createdAt.toMillis() <= otherLastReadAt.toMillis();
                }
              }
            }

            if (msg.systemType === 'transaction_completed') {
              // More reliable seller check: If the listing belongs to the current user
              // However, we don't have listing detail here directly in a clean way unless we use conversation metadata.
              // Let's use otherUser and currentUserId logic more clearly.
              // In this app, listing owner is the seller.

              return (
                <View key={msg.id} style={{ alignItems: 'center', marginVertical: 16 }}>
                  <TransactionCompletion
                    isChatView={true}
                    onReviewPress={() => {
                      if (activeTransactionId) {
                        setCompletedTransactionId(activeTransactionId);
                        setReviewModalVisible(true);
                      } else {
                        Alert.alert(t('common.error'), "Transaction data missing");
                      }
                    }}
                    onHomePress={() => navigation.navigate('MainTabs')}
                    isSeller={isSeller}
                    hasReview={hasReview}
                  />
                </View>
              );
            }

            if (msg.systemType === 'payment_completed') {
              return (
                <View key={msg.id} style={{ alignItems: 'center', marginVertical: 16 }}>
                  <View style={{
                    backgroundColor: '#fff',
                    padding: 20,
                    borderRadius: 16,
                    alignItems: 'center',
                    width: '80%',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                    borderWidth: 1,
                    borderColor: '#f0fdf4'
                  }}>
                    <View style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: '#f0fdf4',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}>
                      <MaterialIcons name="check" size={32} color="#22c55e" />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 8, textAlign: 'center' }}>
                      {t('screen.chat.messages.system.paymentCompleted')}
                    </Text>
                    <Pressable
                      style={{
                        backgroundColor: '#22c55e',
                        paddingVertical: 12,
                        paddingHorizontal: 24,
                        borderRadius: 24,
                        marginTop: 12,
                        width: '100%',
                        alignItems: 'center'
                      }}
                      onPress={() => {
                        if (activeTransactionId) {
                          navigation.navigate('TransactionDetail', { transactionId: activeTransactionId });
                        } else {
                          // Fallback: This might happen if transaction just created and not refreshed.
                          // We should probably rely on re-fetching.
                          Alert.alert(t('common.loading'));
                        }
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('screen.chat.messages.system.enterPin')}</Text>
                    </Pressable>
                  </View>
                </View>
              );
            }

            return (
              <View key={msg.id} style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                {msg.imageUrl ? (
                  <Image source={{ uri: msg.imageUrl }} style={styles.msgImage} resizeMode="cover" />
                ) : null}
                {msg.text ? (
                  <>
                    {/* Show translated text if available and not in "show original" mode */}
                    <Text style={isMe ? styles.msgMine : styles.msg}>
                      {!isMe && translations[msg.id] && !showOriginal[msg.id]
                        ? translations[msg.id]
                        : msg.text}
                    </Text>

                    {/* Show translation toggle/trigger for incoming messages */}
                    {!isMe && !msg.systemType && msg.text && msg.senderLanguage && msg.senderLanguage !== i18n.language && (
                      <View style={{ marginTop: 6 }}>
                        {!translations[msg.id] ? (
                          // 1. Initial Translate Button
                          <Pressable
                            onPress={() => handleTranslate(msg.id, msg.text, msg.senderLanguage!)}
                            style={styles.translateToggle}
                            disabled={translatingMessages[msg.id]}
                          >
                            {translatingMessages[msg.id] ? (
                              <ActivityIndicator size="small" color="#6b7280" style={{ transform: [{ scale: 0.7 }] }} />
                            ) : (
                              <MaterialIcons name="translate" size={12} color="#6b7280" />
                            )}
                            <Text style={styles.translateToggleText}>
                              {translatingMessages[msg.id]
                                ? t('screen.chat.translating', 'Translating...')
                                : t('screen.chat.translateBtn', 'Translate')}
                            </Text>
                          </Pressable>
                        ) : (
                          // 2. Toggle between Original and Translation
                          <Pressable
                            onPress={() => {
                              setShowOriginal(prev => ({
                                ...prev,
                                [msg.id]: !prev[msg.id]
                              }));
                            }}
                            style={styles.translateToggle}
                          >
                            <MaterialIcons
                              name={showOriginal[msg.id] ? "translate" : "history"}
                              size={12}
                              color="#6b7280"
                            />
                            <Text style={styles.translateToggleText}>
                              {showOriginal[msg.id]
                                ? t('screen.chat.showTranslation', 'Show Translation')
                                : t('screen.chat.showOriginal', 'Show Original')}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </>
                ) : null}
                <View style={[styles.msgBottom, isMe && styles.msgBottomMine]}>
                  {isMe && !isRead && (
                    <Text style={styles.unreadCount}>1</Text>
                  )}
                  <Text style={[styles.timestamp, isMe && styles.timestampMine]}>
                    {formatTime(msg.createdAt)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <ReviewModal
          isVisible={isReviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          onSubmit={async (rating, comment) => {
            if (!currentUserId || !completedTransactionId || !conversation) return;

            try {
              const sellerId = conversation.participants.find(p => p !== currentUserId) || '';
              if (!sellerId) return;

              await reviewService.submitReview({
                transactionId: completedTransactionId,
                listingId: conversation.listingId,
                reviewerId: currentUserId,
                revieweeId: sellerId,
                rating,
                comment,
              });

              Alert.alert(t('common.success'), t('screen.transaction.review.success'));
              setReviewModalVisible(false);
              setHasReview(true); // Update local state immediately

            } catch (error) {
              console.error('Review submit failed', error);
              Alert.alert(t('common.error'), t('common.error'));
            }
          }}
        />

        <View style={styles.composer}>
          <Pressable onPress={pickImage} style={styles.iconBtn} disabled={uploading}>
            <MaterialIcons name="add-photo-alternate" size={24} color="#6b7280" />
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder={t('screen.chat.inputPlaceholder')}
            placeholderTextColor="#6b7280"
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!uploading}
          />
          <Pressable style={[styles.send, uploading && styles.sendDisabled]} onPress={handleSend} disabled={uploading} accessibilityRole="button" accessibilityLabel={t('screen.chat.send')}>
            <MaterialIcons name="send" size={18} color="#05250f" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f8f6' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  user: { fontWeight: '700', color: '#111827', fontSize: 15 },
  online: { color: '#6b7280', fontSize: 12 },
  meetCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // Subtle shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  meetIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetTitle: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  meetPlace: {
    marginTop: 1,
    fontWeight: '700',
    color: '#0f172a',
    fontSize: 13
  },
  viewTrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dcfce7'
  },
  viewTrBtnText: {
    color: '#16a34a',
    fontWeight: '700',
    fontSize: 11,
    marginRight: 2
  },
  chatArea: { flex: 1 },
  chatContent: { paddingHorizontal: 12, paddingBottom: 12, gap: 10 },
  day: { alignSelf: 'center', marginVertical: 8, fontSize: 10, color: '#6b7280', fontWeight: '700' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleLeft: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderBottomLeftRadius: 4 },
  bubbleRight: { alignSelf: 'flex-end', backgroundColor: '#19e61b', borderBottomRightRadius: 4 },
  msg: { color: '#1f2937', lineHeight: 20, fontSize: 15 },
  msgMine: { color: '#05250f', lineHeight: 20, fontWeight: '600', fontSize: 15 },
  timestamp: { fontSize: 10, color: '#9ca3af' },
  timestampMine: { color: '#065f13' },
  msgBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginTop: 4, gap: 4 },
  msgBottomMine: { justifyContent: 'flex-end' },
  unreadCount: { fontSize: 10, color: '#065f13', fontWeight: '800' },
  composer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', padding: 12, gap: 10 },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#111827' },
  send: { backgroundColor: '#19e61b', borderRadius: 999, padding: 12 },
  sendDisabled: { opacity: 0.5 },
  iconBtn: { padding: 4 },
  msgImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 4 },
  moreBtn: { padding: 4 },
  translateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  translateToggleText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600'
  },
  translatingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4
  },
  translatingText: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic'
  }
});
