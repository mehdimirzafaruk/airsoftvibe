import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, FlatList, TouchableOpacity, Image } from 'react-native';
import { X, Search, User, Hash, FileText, TrendingUp } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { colors, typographyColors } from '../lib/colors';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'hashtag';
  title: string;
  subtitle?: string;
  image?: string;
  data?: any;
}

export default function SearchModal({ visible, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts' | 'hashtags'>('all');
  const [loading, setLoading] = useState(false);
  const [trendingHashtags, setTrendingHashtags] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      fetchTrendingHashtags();
    } else {
      setSearchQuery('');
      setResults([]);
      setActiveTab('all');
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
    }
  }, [searchQuery, activeTab]);

  const fetchTrendingHashtags = async () => {
    try {
      const { data, error } = await supabase
        .from('hashtag_usage')
        .select('hashtag, count')
        .order('count', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTrendingHashtags((data || []).map(h => h.hashtag));
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      if (activeTab === 'all' || activeTab === 'users') {
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio')
          .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
          .limit(10);

        if (!usersError && users) {
          searchResults.push(
            ...users.map(user => ({
              id: user.id,
              type: 'user' as const,
              title: `@${user.username}`,
              subtitle: user.full_name || user.bio,
              image: user.avatar_url,
              data: user,
            }))
          );
        }
      }

      if (activeTab === 'all' || activeTab === 'posts') {
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            media_urls,
            profiles!posts_user_id_fkey(username, avatar_url)
          `)
          .ilike('content', `%${searchQuery}%`)
          .is('deleted_at', null)
          .limit(10);

        if (!postsError && posts) {
          searchResults.push(
            ...posts.map(post => ({
              id: post.id,
              type: 'post' as const,
              title: post.content.substring(0, 100),
              subtitle: `@${post.profiles?.[0]?.username}`,
              image: post.media_urls?.[0],
              data: post,
            }))
          );
        }
      }

      if (activeTab === 'all' || activeTab === 'hashtags') {
        if (searchQuery.startsWith('#')) {
          const tag = searchQuery.substring(1);
          const { data: hashtags, error: hashtagsError } = await supabase
            .from('hashtag_usage')
            .select('hashtag, count')
            .ilike('hashtag', `%${tag}%`)
            .order('count', { ascending: false })
            .limit(10);

          if (!hashtagsError && hashtags) {
            searchResults.push(
              ...hashtags.map(hashtag => ({
                id: hashtag.hashtag,
                type: 'hashtag' as const,
                title: `#${hashtag.hashtag}`,
                subtitle: `${hashtag.count} gönderi`,
                data: hashtag,
              }))
            );
          }
        }
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User color={colors.accent[600]} size={24} />;
      case 'post':
        return <FileText color={colors.primary[600]} size={24} />;
      case 'hashtag':
        return <Hash color={colors.success[600]} size={24} />;
      default:
        return <Search color={colors.neutral[400]} size={24} />;
    }
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity style={styles.resultItem}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.resultImage} />
      ) : (
        <View style={styles.resultIconContainer}>
          {getIcon(item.type)}
        </View>
      )}
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={styles.resultSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTrendingItem = (hashtag: string) => (
    <TouchableOpacity
      key={hashtag}
      style={styles.trendingChip}
      onPress={() => setSearchQuery(`#${hashtag}`)}
    >
      <TrendingUp color={colors.accent[600]} size={16} />
      <Text style={styles.trendingText}>#{hashtag}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.searchContainer}>
              <Search color={colors.neutral[400]} size={20} />
              <TextInput
                style={styles.searchInput}
                placeholder="Ara..."
                placeholderTextColor={colors.neutral[500]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X color={colors.neutral[400]} size={20} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>İptal</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'all' && styles.activeTab]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                Tümü
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'users' && styles.activeTab]}
              onPress={() => setActiveTab('users')}
            >
              <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
                Kullanıcılar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
              onPress={() => setActiveTab('posts')}
            >
              <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
                Gönderiler
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'hashtags' && styles.activeTab]}
              onPress={() => setActiveTab('hashtags')}
            >
              <Text style={[styles.tabText, activeTab === 'hashtags' && styles.activeTabText]}>
                Etiketler
              </Text>
            </TouchableOpacity>
          </View>

          {searchQuery.length === 0 && trendingHashtags.length > 0 && (
            <View style={styles.trendingSection}>
              <Text style={styles.sectionTitle}>Popüler Etiketler</Text>
              <View style={styles.trendingContainer}>
                {trendingHashtags.map(renderTrendingItem)}
              </View>
            </View>
          )}

          <FlatList
            data={results}
            renderItem={renderResult}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              searchQuery.length > 0 ? (
                <View style={styles.emptyContainer}>
                  <Search color={colors.neutral[400]} size={48} strokeWidth={1.5} />
                  <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
                </View>
              ) : null
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: colors.secondary[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: typographyColors.primary,
    fontSize: 16,
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeText: {
    color: colors.accent[600],
    fontSize: 16,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.secondary[100],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.accent[600],
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: typographyColors.secondary,
  },
  activeTabText: {
    color: colors.accent[600],
  },
  trendingSection: {
    padding: 16,
    backgroundColor: colors.secondary[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: typographyColors.primary,
    marginBottom: 12,
  },
  trendingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.accent[50],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accent[200],
  },
  trendingText: {
    fontSize: 14,
    color: colors.accent[600],
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.secondary[100],
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondary[200],
  },
  resultImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  resultIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: typographyColors.primary,
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: typographyColors.secondary,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: typographyColors.tertiary,
    fontSize: 16,
    marginTop: 16,
  },
});
