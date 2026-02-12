import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../navigation/types';
import { DetailBackButton } from '../components/DetailBackButton';
import { CHATS, USERS } from '../data/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const otherUser = USERS.chatUser;
  const [messages, setMessages] = useState(CHATS);
  const [draft, setDraft] = useState('');

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        sender: 'me',
        text,
      },
    ]);
    setDraft('');
  };

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
            <Image source={{ uri: otherUser.avatar }} style={styles.avatar} />
            <View>
              <Text style={styles.user}>{otherUser.name}</Text>
              <Text style={styles.online}>{otherUser.online === 'Online' ? t('common.online') : t('common.offline')}</Text>
            </View>
            <MaterialIcons name="verified-user" size={20} color="#16a34a" style={{ marginLeft: 'auto' }} />
          </View>
        </View>

        <View style={styles.meetCard}>
          <Text style={styles.meetTitle}>{t('chat.meetupConfirmed')}</Text>
          <Text style={styles.meetPlace}>Starbucks Coffee</Text>
          <Text style={styles.meetMeta}>{t('common.today')} 오후 2:00 • {t('common.minAgo', { count: 45 })}</Text>
        </View>

        <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.day}>{t('common.today')}</Text>

          {messages.map((chat) => {
            if (chat.sender === 'system') {
              return (
                <View key={chat.id} style={[styles.bubble, styles.bubbleSystem]}>
                  {chat.title && <Text style={styles.systemTitle}>{chat.title}</Text>}
                  <Text style={styles.systemText}>{chat.text}</Text>
                </View>
              );
            }
            const isMe = chat.sender === 'me';
            return (
              <View key={chat.id} style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                <Text style={isMe ? styles.msgMine : styles.msg}>{chat.text}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.quickActions}>
          <Text style={styles.quickChip}>{t('chat.changeSchedule')}</Text>
          <Text style={styles.quickChip}>{t('chat.changeSchedule')}</Text>
          <Text style={styles.quickChip}>{t('chat.shareLocation')}</Text>
          <Text style={[styles.quickChip, styles.quickChipWarn]}>{t('chat.safetyTips')}</Text>
        </View>

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder={t('chat.searchPlaceholder')}
            placeholderTextColor="#6b7280"
            value={draft}
            onChangeText={setDraft}
          />
          <Pressable style={styles.send} onPress={handleSend} accessibilityRole="button" accessibilityLabel={t('chat.title')}>
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
  meetCard: { backgroundColor: '#fff', margin: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 12 },
  meetTitle: { color: '#16a34a', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  meetPlace: { marginTop: 4, fontWeight: '700', color: '#111827' },
  meetMeta: { marginTop: 2, color: '#6b7280', fontSize: 12 },
  chatArea: { flex: 1 },
  chatContent: { paddingHorizontal: 12, paddingBottom: 12, gap: 10 },
  day: { alignSelf: 'center', marginVertical: 8, fontSize: 10, color: '#6b7280', fontWeight: '700' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleSystem: { alignSelf: 'center', backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', maxWidth: '90%' },
  systemTitle: { color: '#166534', fontWeight: '800', fontSize: 12 },
  systemText: { marginTop: 4, color: '#166534', fontSize: 12, lineHeight: 17 },
  bubbleLeft: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderBottomLeftRadius: 4 },
  bubbleRight: { alignSelf: 'flex-end', backgroundColor: '#19e61b', borderBottomRightRadius: 4 },
  msg: { color: '#1f2937', lineHeight: 20, fontSize: 15 },
  msgMine: { color: '#05250f', lineHeight: 20, fontWeight: '600', fontSize: 15 },
  quickActions: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  quickChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#4b5563', fontWeight: '600' },
  quickChipWarn: { color: '#b91c1c', borderColor: '#fecaca', backgroundColor: '#fef2f2' },
  composer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', padding: 12, gap: 10 },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#111827' },
  send: { backgroundColor: '#19e61b', borderRadius: 999, padding: 12 },
});
