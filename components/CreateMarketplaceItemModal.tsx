import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Image, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { X, Image as ImageIcon, Send, DollarSign, MapPin, Tag } from 'lucide-react-native';
import { colors, typographyColors } from '../lib/colors';
import { supabase } from '../lib/supabase';
import { uploadMedia } from '../lib/media-upload';

interface CreateMarketplaceItemModalProps {
  visible: boolean;
  onClose: () => void;
  onItemCreated: () => void;
  userId: string;
}

interface MediaFile {
  uri: string;
  type: 'image' | 'video';
}

const categories = [
  { value: 'silah', label: 'Silah' },
  { value: 'ekipman', label: 'Ekipman' },
  { value: 'taktik_malzeme', label: 'Taktik Malzeme' },
  { value: 'aksesuar', label: 'Aksesuar' },
  { value: 'koruma', label: 'Koruma' },
  { value: 'giyim', label: 'Giyim' },
  { value: 'diger', label: 'Diğer' },
];

const conditions = [
  { value: 'new', label: 'Yeni' },
  { value: 'like_new', label: 'Sıfır Gibi' },
  { value: 'used', label: 'Kullanılmış' },
  { value: 'for_parts', label: 'Tamir Gerekli' },
];

export default function CreateMarketplaceItemModal({ 
  visible, 
  onClose, 
  onItemCreated, 
  userId 
}: CreateMarketplaceItemModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [posting, setPosting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Medya kütüphanesine erişim izni gerekiyor');
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      if (typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = (e: any) => {
          const files = Array.from(e.target.files || []) as File[];
          const newMediaFiles: MediaFile[] = [];
          let loadedCount = 0;
          
          files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              const uri = event.target?.result as string;
              if (uri) {
                newMediaFiles.push({ uri, type: 'image' });
                loadedCount++;
                if (loadedCount === files.length) {
                  setMediaFiles([...mediaFiles, ...newMediaFiles]);
                }
              }
            };
            reader.readAsDataURL(file);
          });
        };
        input.click();
      }
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newMedia: MediaFile[] = result.assets.map(asset => ({
          uri: asset.uri,
          type: 'image' as const,
        }));
        setMediaFiles([...mediaFiles, ...newMedia]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Hata', 'Resim seçilirken bir hata oluştu');
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  const handleCreateItem = async () => {
    if (!userId) {
      Alert.alert('Hata', 'İlan oluşturmak için giriş yapmalısınız.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Hata', 'Başlık gereklidir');
      return;
    }

    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Hata', 'Geçerli bir fiyat giriniz');
      return;
    }

    if (!category) {
      Alert.alert('Hata', 'Kategori seçiniz');
      return;
    }

    if (!condition) {
      Alert.alert('Hata', 'Durum seçiniz');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Hata', 'Konum gereklidir');
      return;
    }

    setPosting(true);
    try {
      const imageUrls: string[] = [];

      // Medya dosyalarını yükle
      for (const media of mediaFiles) {
        const result = await uploadMedia(media.uri, userId, media.type);
        imageUrls.push(result.url);
      }

      const { error } = await supabase
        .from('marketplace_items')
        .insert({
          seller_id: userId,
          title: title.trim(),
          description: description.trim() || null,
          price: Number(price),
          currency: 'TL',
          category: category,
          condition: condition,
          images: imageUrls,
          location: location.trim(),
          status: 'active',
        });

      if (error) throw error;

      // Formu temizle
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('');
      setCondition('');
      setLocation('');
      setMediaFiles([]);
      onItemCreated();
      onClose();
      Alert.alert('Başarılı', 'İlan başarıyla oluşturuldu!');
    } catch (error: any) {
      console.error('Error creating marketplace item:', error);
      Alert.alert('Hata', error.message || 'İlan oluşturulurken bir hata oluştu');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Yeni İlan</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={typographyColors.primary} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <Text style={styles.label}>Başlık *</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Tokyo Marui VSR-10 G-Spec"
                placeholderTextColor={colors.neutral[500]}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Açıklama</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ürün hakkında detaylı bilgi..."
                placeholderTextColor={colors.neutral[500]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Fiyat (₺) *</Text>
                  <View style={styles.priceInputContainer}>
                    <DollarSign color={colors.neutral[500]} size={20} />
                    <TextInput
                      style={[styles.input, styles.priceInput]}
                      placeholder="0"
                      placeholderTextColor={colors.neutral[500]}
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.label}>Konum *</Text>
                  <View style={styles.locationInputContainer}>
                    <MapPin color={colors.neutral[500]} size={20} />
                    <TextInput
                      style={[styles.input, styles.locationInput]}
                      placeholder="Şehir"
                      placeholderTextColor={colors.neutral[500]}
                      value={location}
                      onChangeText={setLocation}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Kategori *</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => {
                      setShowConditionPicker(false);
                      setShowCategoryPicker(!showCategoryPicker);
                    }}
                  >
                    <Text style={[styles.pickerText, !category && styles.placeholder]}>
                      {category ? categories.find(c => c.value === category)?.label : 'Seçiniz'}
                    </Text>
                    <Tag color={colors.neutral[500]} size={20} />
                  </TouchableOpacity>
                  {showCategoryPicker && (
                    <View style={styles.pickerOptions}>
                      {categories.map((cat) => (
                        <TouchableOpacity
                          key={cat.value}
                          style={[
                            styles.pickerOption,
                            category === cat.value && styles.pickerOptionSelected,
                          ]}
                          onPress={() => {
                            setCategory(cat.value);
                            setShowCategoryPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerOptionText,
                              category === cat.value && styles.pickerOptionTextSelected,
                            ]}
                          >
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.label}>Durum *</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => {
                      setShowCategoryPicker(false);
                      setShowConditionPicker(!showConditionPicker);
                    }}
                  >
                    <Text style={[styles.pickerText, !condition && styles.placeholder]}>
                      {condition ? conditions.find(c => c.value === condition)?.label : 'Seçiniz'}
                    </Text>
                    <Tag color={colors.neutral[500]} size={20} />
                  </TouchableOpacity>
                  {showConditionPicker && (
                    <View style={styles.pickerOptions}>
                      {conditions.map((cond) => (
                        <TouchableOpacity
                          key={cond.value}
                          style={[
                            styles.pickerOption,
                            condition === cond.value && styles.pickerOptionSelected,
                          ]}
                          onPress={() => {
                            setCondition(cond.value);
                            setShowConditionPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerOptionText,
                              condition === cond.value && styles.pickerOptionTextSelected,
                            ]}
                          >
                            {cond.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.label}>Fotoğraflar</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <ImageIcon color={colors.accent[600]} size={24} />
                <Text style={styles.imagePickerText}>Fotoğraf Ekle</Text>
              </TouchableOpacity>

              {mediaFiles.length > 0 && (
                <View style={styles.mediaPreview}>
                  {mediaFiles.map((media, index) => (
                    <View key={index} style={styles.mediaItem}>
                      <Image source={{ uri: media.uri }} style={styles.mediaImage} />
                      <TouchableOpacity
                        style={styles.removeMediaButton}
                        onPress={() => removeMedia(index)}
                      >
                        <X color={colors.neutral[0]} size={16} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitButton, posting && styles.submitButtonDisabled]}
                onPress={handleCreateItem}
                disabled={posting}
              >
                <Send color={colors.neutral[0]} size={20} />
                <Text style={styles.submitButtonText}>
                  {posting ? 'Oluşturuluyor...' : 'İlanı Yayınla'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.secondary[100],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: typographyColors.primary,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: 600,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: typographyColors.primary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.secondary[200],
    borderRadius: 12,
    padding: 12,
    color: typographyColors.primary,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.secondary[200],
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  priceInput: {
    flex: 1,
    borderWidth: 0,
    padding: 12,
    margin: 0,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.secondary[200],
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  locationInput: {
    flex: 1,
    borderWidth: 0,
    padding: 12,
    margin: 0,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.secondary[200],
    borderRadius: 12,
    padding: 12,
  },
  pickerText: {
    fontSize: 16,
    color: typographyColors.primary,
  },
  placeholder: {
    color: colors.neutral[500],
  },
  pickerOptions: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: colors.secondary[100],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondary[200],
    zIndex: 1000,
    maxHeight: 200,
    overflow: 'hidden',
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  pickerOptionSelected: {
    backgroundColor: colors.accent[50],
  },
  pickerOptionText: {
    fontSize: 16,
    color: typographyColors.primary,
  },
  pickerOptionTextSelected: {
    color: colors.accent[600],
    fontWeight: '600',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent[50],
    borderWidth: 2,
    borderColor: colors.accent[600],
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent[600],
  },
  mediaPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  mediaItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent[600],
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.neutral[0],
  },
});

