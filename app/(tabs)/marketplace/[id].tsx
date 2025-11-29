import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Platform, Dimensions, Share, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, MapPin, Tag, Edit, ArrowLeft, Share2, MessageCircle } from 'lucide-react-native';
import { useAuth } from '../../../lib/auth-context';
import { supabase } from '../../../lib/supabase';
import { colors, typographyColors } from '../../../lib/colors';
import CreateMarketplaceItemModal from '../../../components/CreateMarketplaceItemModal';

const { width } = Dimensions.get('window');

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  location: string;
  status: string;
  seller_id: string;
  created_at: string;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

const categoryLabels: Record<string, string> = {
  'silah': 'Silah',
  'ekipman': 'Ekipman',
  'taktik_malzeme': 'Taktik Malzeme',
  'aksesuar': 'Aksesuar',
  'koruma': 'Koruma',
  'giyim': 'Giyim',
  'diger': 'Diğer',
};

const conditionLabels: Record<string, string> = {
  'new': 'Yeni',
  'like_new': 'Sıfır Gibi',
  'used': 'Kullanılmış',
  'for_parts': 'Tamir Gerekli',
};

const conditionColors: Record<string, string> = {
  'new': colors.success[600],
  'like_new': colors.success[400],
  'used': colors.warning[400],
  'for_parts': colors.status.error,
};

export default function MarketplaceItemDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_items')
        .select(`
          *,
          profiles!marketplace_items_seller_id_fkey(username, full_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setItem(data);
    } catch (error) {
      console.error('Error fetching item:', error);
      Alert.alert('Hata', 'İlan yüklenirken bir hata oluştu');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!user?.id || !item || item.seller_id !== user.id) {
      Alert.alert('Hata', 'Sadece kendi ilanlarınızı düzenleyebilirsiniz');
      return;
    }
    setEditModalVisible(true);
  };

  const handleShare = async () => {
    if (!item) return;
    
    try {
      const shareUrl = `https://xnjepkomavsnhdjzpnaj.supabase.co/marketplace/${item.id}`;
      const shareMessage = `${item.title}\n${item.price.toLocaleString('tr-TR')} ₺\n\n${shareUrl}`;
      
      if (Platform.OS === 'web') {
        // Web için clipboard'a kopyala
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareMessage);
          Alert.alert('Başarılı', 'İlan linki panoya kopyalandı!');
        } else {
          Alert.alert('Bilgi', shareMessage);
        }
      } else {
        // Mobil için native share
        const result = await Share.share({
          message: shareMessage,
          title: item.title,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Hata', 'Paylaşım sırasında bir hata oluştu');
    }
  };

  const handleMessageSeller = () => {
    if (!user?.id) {
      Alert.alert('Hata', 'Mesaj göndermek için giriş yapmalısınız');
      return;
    }
    if (!item || item.seller_id === user.id) {
      Alert.alert('Bilgi', 'Kendi ilanınıza mesaj gönderemezsiniz');
      return;
    }
    // Mesaj ekranına yönlendir
    router.push({
      pathname: '/(tabs)/messages',
      params: { userId: item.seller_id },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={typographyColors.primary} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>İlan Detayı</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={typographyColors.primary} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>İlan Bulunamadı</Text>
          <View style={styles.headerRight} />
        </View>
      </View>
    );
  }

  const isOwner = user?.id === item.seller_id;
  const hasImages = item.images && item.images.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={typographyColors.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İlan Detayı</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerActionButton}>
            <Share2 color={typographyColors.primary} size={24} />
          </TouchableOpacity>
          {isOwner ? (
            <TouchableOpacity onPress={handleEdit} style={styles.headerActionButton}>
              <Edit color={typographyColors.primary} size={24} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleMessageSeller} style={styles.headerActionButton}>
              <MessageCircle color={typographyColors.primary} size={24} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Fotoğraflar */}
        {hasImages && (
          <View style={styles.imageContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(index);
              }}
              style={styles.imageScrollView}
            >
              {item.images.map((imageUrl, index) => (
                <Image
                  key={index}
                  source={{ uri: imageUrl }}
                  style={styles.mainImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {item.images.length > 1 && (
              <View style={styles.imageIndicator}>
                <Text style={styles.imageIndicatorText}>
                  {currentImageIndex + 1} / {item.images.length}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* İçerik */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={[styles.conditionBadge, { backgroundColor: conditionColors[item.condition] + '20' }]}>
              <Text style={[styles.conditionText, { color: conditionColors[item.condition] }]}>
                {conditionLabels[item.condition] || item.condition}
              </Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{item.price.toLocaleString('tr-TR')} ₺</Text>
            <View style={styles.categoryBadge}>
              <Tag color={colors.primary[600]} size={16} />
              <Text style={styles.categoryText}>{categoryLabels[item.category] || item.category}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MapPin color={colors.neutral[500]} size={18} />
            <Text style={styles.location}>{item.location}</Text>
          </View>

          {item.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Açıklama</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}

          <View style={styles.sellerSection}>
            <Text style={styles.sellerTitle}>Satıcı</Text>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarText}>
                  {item.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>@{item.profiles?.username || 'Anonim'}</Text>
                {item.profiles?.full_name && (
                  <Text style={styles.sellerFullName}>{item.profiles.full_name}</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <CreateMarketplaceItemModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          fetchItem();
        }}
        onItemCreated={() => {
          fetchItem();
          setEditModalVisible(false);
        }}
        userId={user?.id || ''}
        editItem={item ? {
          id: item.id,
          title: item.title,
          description: item.description || '',
          price: item.price,
          category: item.category,
          condition: item.condition,
          location: item.location,
          images: item.images || [],
        } : null}
      />
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
    backgroundColor: colors.background.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: typographyColors.primary,
  },
  headerRight: {
    width: 40,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: typographyColors.secondary,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: width,
  },
  imageScrollView: {
    width: '100%',
    height: '100%',
  },
  mainImage: {
    width: width,
    height: width,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  imageIndicatorText: {
    color: colors.neutral[0],
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: typographyColors.primary,
    lineHeight: 32,
  },
  conditionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.accent[50],
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  location: {
    fontSize: 16,
    color: typographyColors.secondary,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: typographyColors.primary,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: typographyColors.secondary,
    lineHeight: 24,
  },
  sellerSection: {
    marginBottom: 24,
  },
  sellerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: typographyColors.primary,
    marginBottom: 12,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerAvatarText: {
    color: colors.neutral[0],
    fontSize: 20,
    fontWeight: 'bold',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: typographyColors.primary,
    marginBottom: 4,
  },
  sellerFullName: {
    fontSize: 14,
    color: typographyColors.secondary,
  },
});

