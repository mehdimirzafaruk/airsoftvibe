import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, Platform } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { colors, typographyColors } from '@/lib/colors';
import { MessageCircle, Users, Search, MoreVertical, Edit } from 'lucide-react-native';

interface Conversation {
  id: string;
  type: 'dm' | 'group';
  name: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dm' | 'groups'>('dm');

  const fetchConversations = async () => {
    if (!user?.id) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      if (activeTab === 'dm') {
        const { data: sentMessages } = await supabase
          .from('direct_messages')
          .select('*, recipient:profiles!direct_messages_recipient_id_fkey(username)')
          .eq('sender_id', user.id)
          .not('deleted_by', 'cs', `{${user.id}}`)
          .order('created_at', { ascending: false });

        const { data: receivedMessages } = await supabase
          .from('direct_messages')
          .select('*, sender:profiles!direct_messages_sender_id_fkey(username)')
          .eq('recipient_id', user.id)
          .not('deleted_by', 'cs', `{${user.id}}`)
          .order('created_at', { ascending: false });

        const allMessages = [...(sentMessages || []), ...(receivedMessages || [])];
        const uniqueConversations = new Map<string, Conversation>();

        allMessages.forEach((msg: any) => {
          const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
          const otherUsername = msg.sender_id === user.id ? msg.recipient?.username : msg.sender?.username;

          if (!uniqueConversations.has(otherUserId)) {
            uniqueConversations.set(otherUserId, {
              id: otherUserId,
              type: 'dm',
              name: otherUsername || 'Unknown',
              last_message: msg.content,
              last_message_time: msg.created_at,
              unread_count: 0,
            });
          }
        });

        setConversations(Array.from(uniqueConversations.values()));
      } else {
        const { data: groupMemberships } = await supabase
          .from('group_members')
          .select('*, group:group_chats(*)')
          .eq('user_id', user.id);

        const groupConversations = (groupMemberships || []).map((membership: any) => ({
          id: membership.group.id,
          type: 'group' as const,
          name: membership.group.name,
          last_message: 'Grup sohbeti',
          last_message_time: membership.group.created_at,
          unread_count: 0,
        }));

        setConversations(groupConversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [activeTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const isUnread = (item.unread_count || 0) > 0;
    return (
      <TouchableOpacity style={styles.conversationCard}>
        <View style={styles.conversationLeft}>
          <View style={styles.avatarContainer}>
            {item.type === 'dm' ? (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : (
              <View style={styles.groupAvatar}>
                <Users color={colors.primary[500]} size={28} />
              </View>
            )}
          </View>
          <View style={styles.conversationContent}>
            <Text style={styles.conversationName}>{item.name}</Text>
            {item.last_message && (
              <Text 
                style={[styles.lastMessage, isUnread && styles.lastMessageUnread]} 
                numberOfLines={1}
              >
                {item.last_message}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.conversationRight}>
          {item.last_message_time && (
            <Text style={[styles.timestamp, isUnread && styles.timestampUnread]}>
              {getTimeAgo(item.last_message_time)}
            </Text>
          )}
          {isUnread && (
            <View style={styles.unreadBadge}>
              {item.unread_count && item.unread_count > 9 ? (
                <Text style={styles.unreadCount}>9+</Text>
              ) : (
                <Text style={styles.unreadCount}>{item.unread_count}</Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Şimdi';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}d`;
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours.toString().padStart(2, '0')}:${Math.floor((diffInSeconds % 3600) / 60).toString().padStart(2, '0')}`;
    }
    if (diffInSeconds < 604800) return 'Dün';
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon}>
          <Search color={typographyColors.primary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mesajlar</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <MoreVertical color={typographyColors.primary} size={28} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary[500]} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'dm' ? 'Henüz mesajınız yok' : 'Henüz grup sohbetiniz yok'}
            </Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab}>
        <Edit color={colors.neutral[0]} size={32} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 8,
    backgroundColor: colors.background.light,
  },
  headerIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: typographyColors.primary,
    fontFamily: Platform.select({
      web: '"Space Grotesk", sans-serif',
      default: 'System',
    }),
  },
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 100,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 12,
    marginVertical: 2,
  },
  conversationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.neutral[0],
    fontSize: 20,
    fontWeight: 'bold',
  },
  groupAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationName: {
    color: typographyColors.primary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  lastMessage: {
    color: typographyColors.secondary,
    fontSize: 14,
  },
  lastMessageUnread: {
    color: colors.primary[500],
    fontWeight: 'bold',
  },
  conversationRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  timestamp: {
    color: typographyColors.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  timestampUnread: {
    color: colors.primary[500],
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: colors.neutral[0],
    fontSize: 12,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 16,
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: typographyColors.tertiary,
    fontSize: 16,
  },
});

