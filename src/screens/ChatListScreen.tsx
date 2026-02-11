import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { resetToTab, TabKey } from '../navigation/tabRouting';
import { BottomTabMock } from '../components/BottomTabMock';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatList'>;

const conversations = [
  {
    id: 'conv-1',
    name: 'Sarah Jenkins',
    time: '2m ago',
    message: 'Is the vintage camera still available?',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAXDFusrww-0NiN5lgomaHF6hJbfcOTH4KFRlbZXkentM66htaWigM6YfOdjGHPudkX60Em6SX-hlGmo-jpWmXEsKKRtGOPAJj5_CA4cTNJ32Sy-kUksUgYJzZ0yLaEdS2dSQhZ0rFiSMm9__3NjTHUI7cKqGcOOYUa4RfkBFC6qgW0KqaYLFsdej7I-lHbmB5RYNPbU4ENyB61Q3FaqpyEiVAuXeQh5roikYlImsB8iwnYfKxBl70Z9CXwOqvIMkcMDsw-JDf6wVlW',
    unread: true,
  },
  {
    id: 'conv-2',
    name: 'Marcus Thorne',
    time: '1h ago',
    message: 'I can meet at 5 PM today near the station.',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuASxyrVXx5ugJot0JMAjzHKrogNY0gF51JKfqE2HSMM9S5-ZEvxHU_hBTUymrDkMcy751Y3qjlVZR8AzZMXz1aN1Ek2ct1nUZtS7zj0N7cD4yvIB8rQXHNg3X2iY7zI6auMldr6AErzh-9iX5-qZkcdAvbGVqt8yohDwsdptH3881Ln69sMiwaH9agB-gyS2w2wIrQqA-Ah4m2pYZju3qeH8VW7jc9Bw_CSEyt9sKCBHTQaXXvBbdqPWnWB2-FmeISNsIk1Ub1BnH2Y',
    unread: false,
  },
  {
    id: 'conv-3',
    name: 'Julian Reed',
    time: '8h ago',
    message: 'Would you take $450 for the set?',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAfuaDvPDZ2GeqFXPZ2vLIsEYIFBm42Oi8spkZFlbNp6ScH2zmPIRA18qK0CRuA75eXe9B2YCgo9H_Jb0y5XeOLzUHnkvjAQ4hOo4CvpuKkYiPihKct9WI9Vndc3a0Wxlt83lXgH9T7HmxQ7QVmV5DGN-nlzuPj0VkiOkp4JrF784Fg4hDdhzX_tF4WAOzdbtjzEGGOBxdTakeGhnOmds3r4bOiJZBfWJQaLsarkLbZm1TjPuNI93FfQ__5d4qeBCU3MnHRM_yLFNIR',
    unread: true,
  },
];

export function ChatListScreen({ navigation }: Props) {
  const handleTabPress = (tab: TabKey) => resetToTab(navigation, tab, 'chat');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.filterButton}>
          <MaterialIcons name="tune" size={20} color="#19e61b" />
        </View>
      </View>

      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={18} color="#9ca3af" />
        <TextInput style={styles.searchInput} placeholder="Search conversations..." />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {conversations.map((item) => (
          <Pressable key={item.id} style={styles.row} onPress={() => navigation.navigate('Chat')}>
            <View>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              {item.unread ? <View style={styles.onlineDot} /> : null}
            </View>
            <View style={styles.textWrap}>
              <View style={styles.rowTop}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <Text numberOfLines={1} style={[styles.message, item.unread && styles.messageUnread]}>
                {item.message}
              </Text>
            </View>
            {item.unread ? <View style={styles.unreadDot} /> : null}
          </Pressable>
        ))}
      </ScrollView>
      <BottomTabMock active="chat" onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f8f6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 32, fontWeight: '800', color: '#064e3b' },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2ed',
    paddingVertical: 14,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  onlineDot: {
    position: 'absolute',
    right: 2,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#19e61b',
    borderWidth: 2,
    borderColor: '#fff',
  },
  textWrap: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, gap: 8 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  time: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  message: { fontSize: 13, color: '#6b7280' },
  messageUnread: { color: '#111827', fontWeight: '600' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#19e61b',
  },
});
