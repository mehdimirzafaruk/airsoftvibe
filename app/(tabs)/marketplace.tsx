import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, ScrollView, Alert, Platform } from 'react-native';
import { Plus, Search, Heart, MapPin, Tag, Bell, ShoppingCart, Settings } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { colors, typographyColors } from '../../lib/colors';
import CreateMarketplaceItemModal from '../../components/CreateMarketplaceItemModal';

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
  };
}

const categoryLabels: Record<string, string> = {
  'silah': 'Silah',
  'ekipman': 'Ekipman',
  'taktik_malzeme': 'Taktik',
  'aksesuar': 'Aksesuar',
  'koruma': 'Koruma',
  'giyim': 'Giyim',
  'diger': 'Diğer',
};

const conditionLabels: Record<string, string> = {
  'yeni': 'Yeni',
  'sifir_gibi': 'Sıfır Gibi',
  'kullanilmis': 'Kullanılmış',
  'tamir_gerekli': 'Tamir Gerekli',
};

const conditionColors: Record<string, string> = {
  'yeni': colors.success[600],
  'sifir_gibi': colors.success[400],
  'kullanilmis': colors.warning[400],
  'tamir_gerekli': colors.status.error,
};

export default function MarketplaceScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [createModalVisible, setCreateModalVisible] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [selectedCategory]);

  const fetchItems = async () => {
    try {
      let query = supabase
        .from('marketplace_items')
        .select(`
          *,
          profiles!marketplace_items_seller_id_fkey(username)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const renderItem = ({ item, index }: { item: MarketplaceItem; index: number }) => {
    const hasImage = item.images && item.images.length > 0;
    const imageUrl = hasImage ? item.images[0] : null;

    return (
      <Animated.View
        entering={FadeInDown.duration(400).delay(index * 50)}
        style={styles.card}
      >
        <TouchableOpacity style={styles.cardTouchable}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.itemImage, styles.placeholderImage]}>
              <Tag color={colors.neutral[400]} size={48} strokeWidth={1.5} />
            </View>
          )}

          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={[styles.conditionBadge, { backgroundColor: conditionColors[item.condition] + '20' }]}>
                <Text style={[styles.conditionText, { color: conditionColors[item.condition] }]}>
                  {conditionLabels[item.condition] || item.condition}
                </Text>
              </View>
            </View>

            <Text style={styles.itemDescription} numberOfLines={2}>
              {item.description}
            </Text>

            <View style={styles.itemFooter}>
              <View style={styles.priceContainer}>
                <Text style={styles.itemPrice}>{item.price.toLocaleString('tr-TR')} ₺</Text>
              </View>

              <View style={styles.locationContainer}>
                <MapPin color={colors.neutral[500]} size={14} />
                <Text style={styles.itemLocation}>{item.location || 'Konum belirtilmemiş'}</Text>
              </View>
            </View>

            <View style={styles.sellerInfo}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarText}>
                  {item.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <Text style={styles.sellerName} numberOfLines={1}>@{item.profiles?.username || 'Anonim'}</Text>
            </View>
            <View style={styles.categoryTagWrapper}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText} numberOfLines={1}>{categoryLabels[item.category] || item.category}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleCreateItem = () => {
    if (!user?.id) {
      Alert.alert('Hata', 'İlan vermek için giriş yapmalısınız');
      return;
    }
    setCreateModalVisible(true);
  };

  const categories = [
    { value: '', label: 'Tümü' },
    { value: 'silah', label: 'Silah' },
    { value: 'ekipman', label: 'Ekipman' },
    { value: 'aksesuar', label: 'Aksesuar' },
    { value: 'giyim', label: 'Giyim' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>Pazar Yeri</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Search color={typographyColors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesContainerWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContainer}
          bounces={false}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryChip,
                selectedCategory === cat.value && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.value)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat.value && styles.categoryChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent[600]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Tag color={colors.neutral[400]} size={64} strokeWidth={1.5} />
            <Text style={styles.emptyText}>Henüz ilan yok</Text>
            <Text style={styles.emptySubtext}>İlk ilanı siz verin!</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateItem}
      >
        <Plus color={colors.neutral[0]} size={24} />
      </TouchableOpacity>

      <CreateMarketplaceItemModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onItemCreated={fetchItems}
        userId={user?.id || ''}
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
    paddingBottom: 8,
    backgroundColor: colors.background.light,
  },
  headerLeft: {
    width: 48,
  },
  headerIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainerWrapper: {
    backgroundColor: colors.background.light,
    paddingTop: 8,
    ...(Platform.OS === 'web' && {
      position: 'sticky',
      top: 72,
      zIndex: 10,
    }),
  },
  categoriesScroll: {
    maxHeight: 40,
  },
  categoriesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: `${colors.primary[500]}33`, // primary/20
    marginHorizontal: 4,
  },
  categoryChipActive: {
    backgroundColor: colors.primary[500],
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: typographyColors.primary,
  },
  categoryChipTextActive: {
    color: colors.neutral[0],
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    gap: 12,
  },
  card: {
    flex: 1,
    maxWidth: '48%',
    marginBottom: 12,
  },
  cardTouchable: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 0,
  },
  itemImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: colors.primary[100],
    borderRadius: 12,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    paddingTop: 12,
    paddingHorizontal: 0,
  },
  cardHeader: {
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: typographyColors.primary,
    marginBottom: 6,
    lineHeight: 20,
  },
  conditionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 12,
    color: typographyColors.secondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  itemFooter: {
    marginBottom: 8,
  },
  priceContainer: {
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: typographyColors.primary,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemLocation: {
    fontSize: 11,
    color: typographyColors.tertiary,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.secondary[200],
    gap: 6,
    marginBottom: 8,
  },
  sellerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerAvatarText: {
    color: colors.neutral[0],
    fontSize: 10,
    fontWeight: 'bold',
  },
  sellerName: {
    fontSize: 11,
    color: typographyColors.secondary,
    fontWeight: '600',
    flex: 1,
  },
  categoryTagWrapper: {
    width: '100%',
    marginTop: 4,
  },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: colors.accent[50],
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 10,
    color: colors.primary[600],
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: typographyColors.secondary,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: typographyColors.tertiary,
    marginTop: 8,
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
