import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, Alert, Platform } from 'react-native';
import { Heart, MessageCircle as MessageCircleIcon, Bookmark, Send, Share, Search, Bell, MoreHorizontal, Edit, Trash2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { colors, typographyColors } from '../../lib/colors';
import CreatePostModal from '../../components/CreatePostModal';
import CommentsModal from '../../components/CommentsModal';
import AdBanner from '../../components/AdBanner';
import { useRouter } from 'expo-router';

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  media_urls: string[];
  location?: string;
  profiles: {
    username: string;
    avatar_url?: string;
  };
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [showPostMenu, setShowPostMenu] = useState<string | null>(null);

  // Menü dışına tıklanınca kapat
  useEffect(() => {
    if (showPostMenu) {
      const handleClickOutside = () => {
        setShowPostMenu(null);
      };
      // Web için
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
      }
    }
  }, [showPostMenu]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (username, avatar_url)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          const { count: likesCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          const { count: commentsCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
            .is('deleted_at', null);

          let likeData = null;
          let saveData = null;

          // Sadece kullanıcı giriş yapmışsa like ve save durumlarını kontrol et
          if (user?.id) {
            const { data: like } = await supabase
              .from('likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle();

            const { data: save } = await supabase
              .from('post_saves')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle();

            likeData = like;
            saveData = save;
          }

          return {
            ...post,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            is_liked: !!likeData,
            is_saved: !!saveData,
          };
        })
      );

      setPosts(postsWithCounts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user?.id) {
      Alert.alert('Hata', 'Beğenmek için giriş yapmalısınız');
      return;
    }
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });
        if (error) throw error;
      }
      await fetchPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Hata', 'Beğeni işlemi başarısız oldu');
    }
  };

  const handleSave = async (postId: string, isSaved: boolean) => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kaydetmek için giriş yapmalısınız');
      return;
    }
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('post_saves')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_saves')
          .insert({
            post_id: postId,
            user_id: user.id,
          });
        if (error) throw error;
      }
      await fetchPosts();
    } catch (error) {
      console.error('Error toggling save:', error);
      Alert.alert('Hata', 'Kaydetme işlemi başarısız oldu');
    }
  };

  const handleComment = (postId: string) => {
    setSelectedPostId(postId);
    setCommentsModalVisible(true);
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      'Gönderiyi Sil',
      'Bu gönderiyi silmek istediğinize emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId)
                .eq('user_id', user?.id);

              if (error) throw error;
              await fetchPosts();
              Alert.alert('Başarılı', 'Gönderi silindi');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Hata', 'Gönderi silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
    setShowPostMenu(null);
  };

  const handleEditPost = (post: Post) => {
    setEditPost(post);
    setCreateModalVisible(true);
    setShowPostMenu(null);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Şimdi';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}d`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}s`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}g`;
    return date.toLocaleDateString('tr-TR');
  };

  const renderPost = ({ item, index }: { item: Post; index: number }) => (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 50)}
      style={styles.postCard}
    >
      <View style={styles.postHeader}>
        <View style={styles.postAuthor}>
          {item.profiles.avatar_url ? (
            <Image
              source={{ uri: item.profiles.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.profiles.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.username}>{item.profiles.username}</Text>
            <Text style={styles.timestamp}>
              {item.location ? `${item.location} · ` : ''}{getTimeAgo(item.created_at)}
            </Text>
          </View>
        </View>
        <View style={styles.moreButtonContainer}>
          {user?.id === item.user_id && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={(e) => {
                e.stopPropagation();
                setShowPostMenu(showPostMenu === item.id ? null : item.id);
              }}
            >
              <MoreHorizontal color={typographyColors.secondary} size={20} />
            </TouchableOpacity>
          )}
          {showPostMenu === item.id && user?.id === item.user_id && (
            <>
              {Platform.OS === 'web' && (
                <TouchableOpacity
                  style={styles.menuOverlay}
                  onPress={() => setShowPostMenu(null)}
                  activeOpacity={1}
                />
              )}
              <View style={styles.postMenu}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleEditPost(item)}
                >
                  <Edit color={typographyColors.primary} size={18} />
                  <Text style={styles.menuItemText}>Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemDanger]}
                  onPress={() => handleDeletePost(item.id)}
                >
                  <Trash2 color={colors.status.error} size={18} />
                  <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Sil</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {item.media_urls && item.media_urls.length > 0 && (
        <Image
          source={{ uri: item.media_urls[0] }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.postContent}>
        <Text style={styles.postText}>
          <Text style={styles.usernameBold}>{item.profiles.username}</Text> {item.content}
        </Text>

        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id, item.is_liked || false)}
          >
            <Heart
              color={item.is_liked ? '#ef4444' : typographyColors.secondary}
              fill={item.is_liked ? '#ef4444' : 'transparent'}
              size={20}
            />
            <Text style={[styles.actionCount, item.is_liked && styles.actionCountLiked]}>
              {item.likes_count || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleComment(item.id)}
          >
            <MessageCircleIcon color={typographyColors.secondary} size={20} />
            <Text style={styles.actionCount}>{item.comments_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Share color={typographyColors.secondary} size={20} />
          </TouchableOpacity>

          <View style={styles.actionSpacer} />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSave(item.id, item.is_saved || false)}
          >
            <Bookmark
              color={item.is_saved ? colors.primary[600] : typographyColors.secondary}
              fill={item.is_saved ? colors.primary[600] : 'transparent'}
              size={20}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>Ana Akış</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/(tabs)/notifications')}
            >
              <Bell color={typographyColors.primary} size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary[600]} />
        }
        contentContainerStyle={styles.listContent}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz gönderi yok</Text>
          </View>
        }
      />

      {user?.id && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (!user?.id) {
              Alert.alert('Hata', 'Gönderi oluşturmak için giriş yapmalısınız');
              return;
            }
            setCreateModalVisible(true);
          }}
        >
          <Send color={colors.neutral[0]} size={24} />
        </TouchableOpacity>
      )}

      {user?.id && (
        <CreatePostModal
          visible={createModalVisible}
          onClose={() => {
            setCreateModalVisible(false);
            setEditPost(null);
          }}
          onPostCreated={() => {
            fetchPosts();
            setEditPost(null);
          }}
          userId={user.id}
          editPost={editPost ? {
            id: editPost.id,
            content: editPost.content,
            location: editPost.location,
            media_urls: editPost.media_urls || [],
          } : null}
        />
      )}

      {selectedPostId && (
        <CommentsModal
          visible={commentsModalVisible}
          onClose={() => {
            setCommentsModalVisible(false);
            setSelectedPostId(null);
          }}
          postId={selectedPostId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: Platform.select({
      ios: 'rgba(248, 247, 245, 0.8)',
      web: 'rgba(248, 247, 245, 0.8)',
      default: colors.background.light,
    }),
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(12px)',
    }),
    borderBottomWidth: 0,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    height: Platform.OS === 'ios' ? 80 : 64,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeft: {
    width: 48,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  list: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 80 : 60,
  },
  listContent: {
    paddingVertical: 16,
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: 'transparent',
    marginHorizontal: 0,
    marginVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    ...(Platform.OS === 'web' && {
      borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    }),
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 0,
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.neutral[0],
    fontSize: 16,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: typographyColors.primary,
  },
  usernameBold: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: typographyColors.secondary,
    marginTop: 2,
  },
  moreButtonContainer: {
    position: 'relative',
    zIndex: 10,
  },
  moreButton: {
    padding: 8,
    borderRadius: 20,
  },
  menuOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  postMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: colors.secondary[100],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondary[200],
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    color: typographyColors.primary,
    fontWeight: '500',
  },
  menuItemTextDanger: {
    color: colors.status.error,
  },
  postImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.neutral[200],
    borderRadius: 12,
    marginTop: 12,
    marginHorizontal: 16,
  },
  postContent: {
    padding: 16,
    paddingTop: 12,
  },
  postText: {
    fontSize: 14,
    color: typographyColors.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '500',
    color: typographyColors.secondary,
  },
  actionCountLiked: {
    color: '#ef4444',
  },
  actionSpacer: {
    flex: 1,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: typographyColors.tertiary,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 24,
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
});
