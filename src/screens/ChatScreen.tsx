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

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
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
            <DetailBackButton onPress={() => navigation.goBack()} />
            <Image
              source={{ uri: otherUser?.avatar || 'https://via.placeholder.com/100' }}
              style={styles.avatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.user}>{otherUser?.name || t('screen.chat.status.loading')}</Text>
              {otherUser?.isVerified && (
                <Text style={styles.online}>{t('screen.chat.status.online')}</Text>
              )}
            </View>
            {otherUser?.isVerified && (
              <MaterialIcons name="verified-user" size={20} color="#16a34a" />
            )}
          </View>
        </View>

        {conversation && (
          <View style={styles.meetCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.meetTitle}>{t('screen.chat.meet.title')}</Text>
              <Text style={styles.meetPlace}>{conversation.listingTitle}</Text>
            </View>
            {activeTransactionId && (
              <Pressable
                style={styles.viewTrBtn}
                onPress={() => navigation.navigate('TransactionDetail', { transactionId: activeTransactionId })}
              >
                <Text style={styles.viewTrBtnText}>{t('screen.transaction.title')}</Text>
                <MaterialIcons name="chevron-right" size={16} color="#16a34a" />
              </Pressable>
            )}
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

            return (
              <View key={msg.id} style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                {msg.imageUrl ? (
                  <Image source={{ uri: msg.imageUrl }} style={styles.msgImage} resizeMode="cover" />
                ) : null}
                {msg.text ? <Text style={isMe ? styles.msgMine : styles.msg}>{msg.text}</Text> : null}
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
  meetCard: { backgroundColor: '#fff', margin: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 12, flexDirection: 'row', alignItems: 'center' },
  meetTitle: { color: '#16a34a', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  meetPlace: { marginTop: 4, fontWeight: '700', color: '#111827' },
  viewTrBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#dcfce7' },
  viewTrBtnText: { color: '#16a34a', fontWeight: '700', fontSize: 12, marginRight: 2 },
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
});
