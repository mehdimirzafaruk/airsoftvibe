import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, FlatList, Image, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { User, Settings, LogOut, Edit, Shield, Award, Target, Users, Heart, Bookmark, TrendingUp, Camera, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { colors, typographyColors } from '../../lib/colors';
import { uploadMedia } from '../../lib/media-upload';

interface UserProfile {
  username: string;
  full_name?: string;
  bio?: string;
  team_info?: string;
  favorite_equipment?: string;
  role: string;
  avatar_url?: string;
}

interface UserStats {
  posts_count: number;
  followers_count: number;
  following_count: number;
  likes_received: number;
}

interface UserXP {
  total_xp: number;
  rank: string;
}

const rankInfo = {
  'Çaylak': { minXP: 0, color: colors.neutral[600], icon: '🌱' },
  'Nişancı': { minXP: 100, color: colors.primary[600], icon: '🎯' },
  'Operatör': { minXP: 500, color: colors.success[600], icon: '⚡' },
  'Kıdemli': { minXP: 1000, color: colors.warning[600], icon: '🏆' },
  'Usta': { minXP: 2500, color: colors.accent[600], icon: '👑' },
  'Kırmızı Gölge': { minXP: 5000, color: colors.status.error, icon: '🔥' },
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ posts_count: 0, followers_count: 0, following_count: 0, likes_received: 0 });
  const [xpData, setXpData] = useState<UserXP | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked' | 'saved'>('posts');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
      fetchStats();
      fetchXP();
      fetchUserPosts();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setEditedProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [postsResult, followersResult, followingResult, likesResult] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user?.id).is('deleted_at', null),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', user?.id),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', user?.id),
        supabase.from('likes').select('id', { count: 'exact', head: true }).eq('user_id', user?.id),
      ]);

      setStats({
        posts_count: postsResult.count || 0,
        followers_count: followersResult.count || 0,
        following_count: followingResult.count || 0,
        likes_received: likesResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchXP = async () => {
    try {
      const { data, error } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setXpData(data);
    } catch (error) {
      console.error('Error fetching XP:', error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setUserPosts(data || []);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editedProfile)
        .eq('id', user?.id);

      if (error) throw error;

      setProfile({ ...profile, ...editedProfile } as UserProfile);
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için izin gerekiyor');
        return;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingAvatar(true);
        const imageUri = result.assets[0].uri;

        const uploadResult = await uploadMedia(imageUri, user?.id, 'image');

        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: uploadResult.url })
          .eq('id', user?.id);

        if (error) throw error;

        setProfile({ ...profile, avatar_url: uploadResult.url } as UserProfile);
        Alert.alert('Başarılı', 'Profil resmi güncellendi');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Hata', 'Profil resmi yüklenirken bir hata oluştu');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getRankProgress = () => {
    const currentXP = xpData?.total_xp || 0;
    const currentRank = xpData?.rank || 'Çaylak';
    const ranks = Object.keys(rankInfo);
    
    // Eğer currentRank rankInfo'da yoksa, varsayılan olarak 'Çaylak' kullan
    const validRank = rankInfo[currentRank as keyof typeof rankInfo] ? currentRank : 'Çaylak';
    const currentIndex = ranks.indexOf(validRank);
    const nextRank = currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : null;

    if (!nextRank) return { progress: 100, nextRank: null, xpNeeded: 0 };

    const currentRankData = rankInfo[validRank as keyof typeof rankInfo];
    const nextRankData = rankInfo[nextRank as keyof typeof rankInfo];

    // Güvenlik kontrolü
    if (!currentRankData || !nextRankData) {
      return { progress: 0, nextRank: null, xpNeeded: 0 };
    }

    const currentMinXP = currentRankData.minXP;
    const nextMinXP = nextRankData.minXP;
    const progress = ((currentXP - currentMinXP) / (nextMinXP - currentMinXP)) * 100;

    return {
      progress: Math.min(Math.max(progress, 0), 100),
      nextRank,
      xpNeeded: nextMinXP - currentXP,
    };
  };

  const rankProgress = getRankProgress();
  // Güvenli rank info alma - eğer rankInfo'da yoksa varsayılan değeri kullan
  const currentRankKey = xpData?.rank || 'Çaylak';
  const currentRankInfo = rankInfo[currentRankKey as keyof typeof rankInfo] || rankInfo['Çaylak'];

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton}>
          <ArrowLeft color={typographyColors.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Profil</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setEditModalVisible(true)}
        >
          <Settings color={typographyColors.primary} size={24} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.profileSection}>
          <TouchableOpacity onPress={handleAvatarChange} disabled={uploadingAvatar}>
            <View style={styles.avatarLarge}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarTextLarge}>
                  {profile?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.nameSection}>
            <Text style={styles.fullName}>{profile?.full_name || profile?.username || 'Kullanıcı'}</Text>
            <Text style={styles.rankText}>{xpData?.rank || 'Çaylak'}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Seviye 5</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${rankProgress.progress}%` }]} />
          </View>
          <Text style={styles.progressSubtext}>
            Sonraki seviyeye {rankProgress.xpNeeded || 0} XP
          </Text>
        </Animated.View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Oyun Sayısı</Text>
            <Text style={styles.statValue}>{stats.posts_count || 42}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>MVP Sayısı</Text>
            <Text style={styles.statValue}>12</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Ekipman Puanı</Text>
            <Text style={styles.statValue}>850</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
              onPress={() => setActiveTab('posts')}
            >
              <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
                Ekipmanlarım
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'liked' && styles.activeTab]}
              onPress={() => setActiveTab('liked')}
            >
              <Text style={[styles.tabText, activeTab === 'liked' && styles.activeTabText]}>
                Rozetlerim
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
              onPress={() => setActiveTab('saved')}
            >
              <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>
                Geçmiş Oyunlar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.emptyTabContent}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Henüz ekipman eklenmemiş.</Text>
          </View>
        </View>

        {/* Çıkış Yap Butonu */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              Alert.alert(
                'Çıkış Yap',
                'Hesabınızdan çıkmak istediğinize emin misiniz?',
                [
                  {
                    text: 'İptal',
                    style: 'cancel',
                  },
                  {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await signOut();
                        router.replace('/auth/login');
                      } catch (error) {
                        Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
                      }
                    },
                  },
                ]
              );
            }}
          >
            <LogOut color={colors.status.error} size={20} />
            <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.fab}>
        <Edit color={colors.neutral[0]} size={24} />
      </TouchableOpacity>
      
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profili Düzenle</Text>

            <TextInput
              style={styles.input}
              placeholder="Ad Soyad"
              placeholderTextColor={colors.neutral[500]}
              value={editedProfile.full_name || ''}
              onChangeText={(text) => setEditedProfile({ ...editedProfile, full_name: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Biyografi"
              placeholderTextColor={colors.neutral[500]}
              value={editedProfile.bio || ''}
              onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
              multiline
              numberOfLines={4}
            />

            <TextInput
              style={styles.input}
              placeholder="Takım Bilgisi"
              placeholderTextColor={colors.neutral[500]}
              value={editedProfile.team_info || ''}
              onChangeText={(text) => setEditedProfile({ ...editedProfile, team_info: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Favori Ekipman"
              placeholderTextColor={colors.neutral[500]}
              value={editedProfile.favorite_equipment || ''}
              onChangeText={(text) => setEditedProfile({ ...editedProfile, favorite_equipment: text })}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: colors.background.light,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: typographyColors.primary,
    fontFamily: Platform.select({
      web: '"Space Grotesk", sans-serif',
      default: 'System',
    }),
  },
  settingsButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 16,
  },
  avatarLarge: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
  },
  avatarTextLarge: {
    color: colors.neutral[0],
    fontSize: 48,
    fontWeight: 'bold',
  },
  nameSection: {
    alignItems: 'center',
    gap: 4,
  },
  fullName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: typographyColors.primary,
    fontFamily: Platform.select({
      web: '"Space Grotesk", sans-serif',
      default: 'System',
    }),
  },
  rankText: {
    fontSize: 16,
    color: typographyColors.secondary,
  },
  progressSection: {
    padding: 16,
    gap: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: typographyColors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 9999,
  },
  progressSubtext: {
    fontSize: 14,
    color: typographyColors.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
  },
  statCard: {
    flex: 1,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: 8,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: typographyColors.primary,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: typographyColors.primary,
    fontFamily: Platform.select({
      web: '"Space Grotesk", sans-serif',
      default: 'System',
    }),
  },
  tabsContainer: {
    paddingTop: 16,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: typographyColors.secondary,
  },
  activeTabText: {
    color: colors.primary[500],
  },
  emptyTabContent: {
    padding: 16,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: typographyColors.tertiary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.secondary[100],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: typographyColors.primary,
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.secondary[200],
    borderRadius: 12,
    padding: 12,
    color: typographyColors.primary,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent[600],
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.accent[600],
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.accent[600],
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  logoutSection: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 100,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card.light,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.status.error,
    gap: 10,
  },
  logoutButtonText: {
    color: colors.status.error,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.select({
      web: '"Space Grotesk", sans-serif',
      default: 'System',
    }),
  },
});

