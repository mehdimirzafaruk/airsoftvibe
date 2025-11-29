import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Calendar, MapPin, Users, Clock, CheckCircle, Circle } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { colors, typographyColors } from '../../lib/colors';

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  capacity: number;
  creator_id: string;
  participants_count?: number;
  is_participating?: boolean;
}

const eventTypeLabels: Record<string, string> = {
  'tournament': 'Turnuva',
  'milsim': 'Milsim',
  'training': 'Eğitim',
  'scenario': 'Senaryo',
  'casual': 'Casual',
};

const eventTypeColors: Record<string, string> = {
  'tournament': colors.accent[600],
  'milsim': colors.success[600],
  'training': colors.warning[600],
  'scenario': colors.primary[600],
  'casual': colors.secondary[600],
};

export default function EventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    try {
      const now = new Date().toISOString();

      let query = supabase
        .from('events')
        .select('*');

      if (filter === 'upcoming') {
        query = query.gte('start_time', now);
      } else {
        query = query.lt('start_time', now);
      }

      const { data, error } = await query.order('start_time', { ascending: filter === 'upcoming' }).limit(50);

      if (error) throw error;

      const eventsWithParticipants = await Promise.all(
        (data || []).map(async (event) => {
          const { count } = await supabase
            .from('event_participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('status', 'going');

          const { data: participantData } = await supabase
            .from('event_participants')
            .select('id')
            .eq('event_id', event.id)
            .eq('user_id', user?.id)
            .eq('status', 'going')
            .maybeSingle();

          return {
            ...event,
            participants_count: count || 0,
            is_participating: !!participantData,
          };
        })
      );

      setEvents(eventsWithParticipants);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleJoinEvent = async (eventId: string, isParticipating: boolean) => {
    if (!user) return;

    try {
      if (isParticipating) {
        await supabase
          .from('event_participants')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('event_participants')
          .insert({
            event_id: eventId,
            user_id: user.id,
            status: 'going',
          });
      }

      fetchEvents();
    } catch (error) {
      console.error('Error toggling participation:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);

    const dateStr = date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
    });

    const timeStr = date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (diffDays === 0) return `Bugün, ${timeStr}`;
    if (diffDays === 1) return `Yarın, ${timeStr}`;
    if (diffDays > 0 && diffDays < 7) return `${diffDays} gün sonra, ${timeStr}`;
    return `${dateStr}, ${timeStr}`;
  };

  const renderEvent = ({ item, index }: { item: Event; index: number }) => (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 50)} style={styles.eventCard}>
      <View style={[styles.typeIndicator, { backgroundColor: colors.accent[600] }]} />

      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{item.title}</Text>
        </View>

        <Text style={styles.eventDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Calendar color={colors.accent[600]} size={16} />
            <Text style={styles.detailText}>{formatDate(item.start_time)}</Text>
          </View>

          <View style={styles.detailRow}>
            <MapPin color={colors.neutral[500]} size={16} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Users color={colors.neutral[500]} size={16} />
            <Text style={styles.detailText}>
              {item.participants_count} / {item.capacity} katılımcı
            </Text>
          </View>
        </View>

        <View style={styles.eventFooter}>
          <View style={styles.participantsProgress}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min((item.participants_count || 0) / item.capacity * 100, 100)}%`,
                  backgroundColor: colors.accent[600],
                },
              ]}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.joinButton,
              item.is_participating && styles.joinButtonActive,
            ]}
            onPress={() => handleJoinEvent(item.id, item.is_participating || false)}
          >
            {item.is_participating ? (
              <>
                <CheckCircle color={colors.neutral[0]} size={18} />
                <Text style={styles.joinButtonTextActive}>Katılıyorum</Text>
              </>
            ) : (
              <>
                <Circle color={colors.accent[600]} size={18} />
                <Text style={styles.joinButtonText}>Katıl</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Etkinlikler</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'upcoming' && styles.filterButtonActive]}
            onPress={() => setFilter('upcoming')}
          >
            <Text style={[styles.filterText, filter === 'upcoming' && styles.filterTextActive]}>
              Yaklaşan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'past' && styles.filterButtonActive]}
            onPress={() => setFilter('past')}
          >
            <Text style={[styles.filterText, filter === 'past' && styles.filterTextActive]}>
              Geçmiş
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent[600]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Calendar color={colors.neutral[400]} size={64} strokeWidth={1.5} />
            <Text style={styles.emptyText}>
              {filter === 'upcoming' ? 'Yaklaşan etkinlik yok' : 'Geçmiş etkinlik yok'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  header: {
    padding: 16,
    paddingTop: 50,
    backgroundColor: colors.secondary[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.accent[600],
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.secondary[200],
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.accent[600],
    borderColor: colors.accent[600],
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: typographyColors.secondary,
  },
  filterTextActive: {
    color: colors.neutral[0],
  },
  listContent: {
    padding: 12,
  },
  eventCard: {
    backgroundColor: colors.secondary[100],
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.secondary[200],
    flexDirection: 'row',
  },
  typeIndicator: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: typographyColors.primary,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  eventDescription: {
    fontSize: 14,
    color: typographyColors.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  eventDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: typographyColors.secondary,
    flex: 1,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  participantsProgress: {
    flex: 1,
    height: 6,
    backgroundColor: colors.primary[100],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent[600],
    backgroundColor: colors.primary[50],
  },
  joinButtonActive: {
    backgroundColor: colors.accent[600],
    borderColor: colors.accent[600],
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent[600],
  },
  joinButtonTextActive: {
    color: colors.neutral[0],
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: typographyColors.tertiary,
    marginTop: 20,
  },
});
