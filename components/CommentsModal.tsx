import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Send, Heart, MessageCircle } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { colors, typographyColors } from '../lib/colors';

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id?: string;
  profiles: {
    username: string;
    avatar_url?: string;
  };
  likes_count?: number;
  is_liked?: boolean;
  replies?: Comment[];
}

export default function CommentsModal({ visible, onClose, postId }: CommentsModalProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      fetchComments();
    }
  }, [visible, postId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (username, avatar_url)
        `)
        .eq('post_id', postId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const commentsWithLikes = await Promise.all(
        (data || []).map(async (comment) => {
          const { count: likesCount } = await supabase
            .from('comment_likes')
            .select('*', { count: 'exact', head: true })
            .eq('comment_id', comment.id);

          const { data: likeData } = await supabase
            .from('comment_likes')
            .select('id')
            .eq('comment_id', comment.id)
            .eq('user_id', user?.id)
            .maybeSingle();

          return {
            ...comment,
            likes_count: likesCount || 0,
            is_liked: !!likeData,
          };
        })
      );

      const threaded = buildCommentTree(commentsWithLikes);
      setComments(threaded);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const buildCommentTree = (flatComments: Comment[]): Comment[] => {
    const tree: Comment[] = [];
    const childrenMap: { [key: string]: Comment[] } = {};

    flatComments.forEach(comment => {
      if (comment.parent_id) {
        if (!childrenMap[comment.parent_id]) {
          childrenMap[comment.parent_id] = [];
        }
        childrenMap[comment.parent_id].push(comment);
      } else {
        tree.push(comment);
      }
    });

    const addChildren = (comment: Comment): Comment => {
      if (childrenMap[comment.id]) {
        return {
          ...comment,
          replies: childrenMap[comment.id].map(addChildren),
        };
      }
      return comment;
    };

    return tree.map(addChildren);
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user?.id,
          content: newComment.trim(),
          parent_id: replyingTo,
        });

      if (error) throw error;

      setNewComment('');
      setReplyingTo(null);
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user?.id);
      } else {
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user?.id,
          });
      }
      fetchComments();
    } catch (error) {
      console.error('Error liking comment:', error);
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
    if (diffMins < 60) return `${diffMins}d`;
    if (diffHours < 24) return `${diffHours}s`;
    return `${diffDays}g`;
  };

  const renderComment = (comment: Comment, level: number = 0) => (
    <Animated.View
      key={comment.id}
      entering={FadeInDown.duration(300)}
      style={[styles.commentContainer, level > 0 && { marginLeft: level * 20 }]}
    >
      <View style={styles.commentHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {comment.profiles.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.commentContent}>
          <View style={styles.commentMeta}>
            <Text style={styles.username}>@{comment.profiles.username}</Text>
            <Text style={styles.time}>{formatTime(comment.created_at)}</Text>
          </View>
          <Text style={styles.commentText}>{comment.content}</Text>
          <View style={styles.commentActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLikeComment(comment.id, comment.is_liked || false)}
            >
              <Heart
                color={comment.is_liked ? colors.accent[600] : colors.neutral[400]}
                fill={comment.is_liked ? colors.accent[600] : 'transparent'}
                size={16}
              />
              {(comment.likes_count || 0) > 0 && (
                <Text style={styles.actionCount}>{comment.likes_count}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setReplyingTo(comment.id)}
            >
              <MessageCircle color={colors.neutral[400]} size={16} />
              <Text style={styles.replyText}>Yanıtla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map(reply => renderComment(reply, level + 1))}
        </View>
      )}
    </Animated.View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Yorumlar</Text>
          <TouchableOpacity onPress={onClose}>
            <X color={colors.neutral[400]} size={24} />
          </TouchableOpacity>
        </View>

        {replyingTo && (
          <View style={styles.replyingBanner}>
            <Text style={styles.replyingText}>Yanıtlıyorsunuz</Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <X color={colors.neutral[400]} size={16} />
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={comments}
          renderItem={({ item }) => renderComment(item)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MessageCircle color={colors.neutral[400]} size={48} strokeWidth={1.5} />
              <Text style={styles.emptyText}>Henüz yorum yok</Text>
              <Text style={styles.emptySubtext}>İlk yorumu siz yapın!</Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.profile?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Yorum yaz..."
            placeholderTextColor={colors.neutral[500]}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.disabled]}
            onPress={handleSendComment}
            disabled={loading || !newComment.trim()}
          >
            <Send color={colors.neutral[0]} size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: colors.secondary[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: typographyColors.primary,
  },
  replyingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.accent[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.accent[200],
  },
  replyingText: {
    fontSize: 14,
    color: colors.accent[600],
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
  commentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentHeader: {
    flexDirection: 'row',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: colors.neutral[0],
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentContent: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: typographyColors.primary,
  },
  time: {
    fontSize: 12,
    color: typographyColors.tertiary,
  },
  commentText: {
    fontSize: 15,
    color: typographyColors.primary,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    fontSize: 12,
    color: typographyColors.secondary,
  },
  replyText: {
    fontSize: 12,
    color: typographyColors.secondary,
    fontWeight: '600',
  },
  repliesContainer: {
    marginTop: 8,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: typographyColors.secondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: typographyColors.tertiary,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.secondary[100],
    borderTopWidth: 1,
    borderTopColor: colors.secondary[200],
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.primary[50],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: typographyColors.primary,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
