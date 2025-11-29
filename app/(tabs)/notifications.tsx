import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Bell, Heart, MessageCircle, UserPlus, Calendar, ShoppingBag, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { colors, typographyColors } from '../../lib/colors';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);

      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const subscription = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getIcon = (type: string) => {
    const iconProps = { size: 24, strokeWidth: 2 };
    switch (type) {
      case 'like':
        return <Heart color={colors.primary[500]} fill={colors.primary[500]} {...iconProps} />;
      case 'comment':
        return <MessageCircle color={colors.primary[500]} {...iconProps} />;
      case 'follow':
        return <UserPlus color={colors.primary[500]} {...iconProps} />;
      case 'event':
        return <Calendar color={colors.primary[500]} {...iconProps} />;
      case 'marketplace':
        return <ShoppingBag color={colors.primary[500]} {...iconProps} />;
      case 'system':
        return <AlertCircle color={colors.primary[500]} {...iconProps} />;
      default:
        return <Bell color={colors.primary[500]} {...iconProps} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={styles.notificationCard}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.iconContainer}>
        {getIcon(item.type)}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.time}>{formatTime(item.created_at)}</Text>
      </View>

      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Tümünü oku</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent[600]} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell color={colors.neutral[400]} size={48} strokeWidth={1.5} />
            <Text style={styles.emptyText}>Henüz bildirim yok</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabIcon}>⚙️</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 12,
    backgroundColor: colors.background.light,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: typographyColors.primary,
    fontFamily: Platform.select({
      web: '"Space Grotesk", sans-serif',
      default: 'System',
    }),
  },
  markAllText: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 100,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    marginVertical: 2,
    marginHorizontal: 16,
    minHeight: 72,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary[500]}33`, // primary/20
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: typographyColors.primary,
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    color: typographyColors.secondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 16,
    width: 56,
    height: 56,
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
  fabIcon: {
    fontSize: 24,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: typographyColors.tertiary,
    fontSize: 16,
    marginTop: 16,
  },
});
