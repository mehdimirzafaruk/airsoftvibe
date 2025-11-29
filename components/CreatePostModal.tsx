import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Image, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { X, Image as ImageIcon, Video, MapPin, Send } from 'lucide-react-native';
import { colors, typographyColors } from '../lib/colors';
import { supabase } from '../lib/supabase';
import { uploadMedia } from '../lib/media-upload';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  userId: string;
  editPost?: {
    id: string;
    content: string;
    location?: string;
    media_urls: string[];
  } | null;
}

interface MediaFile {
  uri: string;
  type: 'image' | 'video';
  isExisting?: boolean; // Mevcut medya mı yoksa yeni mi
}

export default function CreatePostModal({ visible, onClose, onPostCreated, userId, editPost = null }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [posting, setPosting] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);

  // Edit modunda formu doldur
  useEffect(() => {
    if (editPost && visible) {
      setContent(editPost.content || '');
      setLocation(editPost.location || '');
      // Mevcut medyaları yükle
      const existingMedia: MediaFile[] = (editPost.media_urls || []).map(url => ({
        uri: url,
        type: url.includes('video') ? 'video' : 'image',
        isExisting: true
      }));
      setMediaFiles(existingMedia);
      if (editPost.location) {
        setShowLocationInput(true);
      }
    } else if (!editPost && visible) {
      // Yeni post için formu temizle
      setContent('');
      setLocation('');
      setMediaFiles([]);
      setShowLocationInput(false);
    }
  }, [editPost, visible]);

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
    // Web platform için file input kullan
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

    // Mobile platform için ImagePicker kullan
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

  const pickVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const newMedia: MediaFile = {
          uri: result.assets[0].uri,
          type: 'video',
        };
        setMediaFiles([...mediaFiles, newMedia]);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Hata', 'Video seçilirken bir hata oluştu');
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!content.trim() && mediaFiles.length === 0) {
      Alert.alert('Uyarı', 'Gönderi içeriği veya medya ekleyin');
      return;
    }

    // User ID validation
    if (!userId || userId.trim() === '') {
      Alert.alert('Hata', 'Oturumunuz sonlandı. Lütfen tekrar giriş yapın.');
      return;
    }

    setPosting(true);
    try {
      const mediaUrls: string[] = [];

      // Medya dosyalarını işle
      for (const media of mediaFiles) {
        if (media.isExisting) {
          // Mevcut medya, URL'yi direkt kullan
          mediaUrls.push(media.uri);
        } else {
          // Yeni medya, yükle
          const result = await uploadMedia(media.uri, userId, media.type);
          mediaUrls.push(result.url);
        }
      }

      if (editPost) {
        // Güncelleme
        const { error } = await supabase
          .from('posts')
          .update({
            content: content.trim(),
            media_urls: mediaUrls,
            location: location.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editPost.id)
          .eq('user_id', userId);

        if (error) throw error;
        Alert.alert('Başarılı', 'Gönderi başarıyla güncellendi!');
      } else {
        // Yeni oluşturma
        const { error } = await supabase
          .from('posts')
          .insert({
            user_id: userId,
            content: content.trim(),
            media_urls: mediaUrls,
            location: location.trim() || null,
          });

        if (error) throw error;
      }

      setContent('');
      setLocation('');
      setMediaFiles([]);
      setShowLocationInput(false);
      onPostCreated();
      onClose();
    } catch (error) {
      console.error('Error saving post:', error);
      Alert.alert('Hata', editPost ? 'Gönderi güncellenirken bir hata oluştu' : 'Gönderi oluşturulurken bir hata oluştu');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{editPost ? 'Gönderiyi Düzenle' : 'Yeni Gönderi'}</Text>
            <TouchableOpacity onPress={onClose} disabled={posting}>
              <X color={colors.neutral[400]} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <TextInput
              style={styles.textInput}
              placeholder="Ne düşünüyorsun?"
              placeholderTextColor={colors.neutral[500]}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={2000}
              editable={!posting}
            />

            {showLocationInput && (
              <View style={styles.locationContainer}>
                <MapPin color={colors.accent[600]} size={20} />
                <TextInput
                  style={styles.locationInput}
                  placeholder="Konum ekle"
                  placeholderTextColor={colors.neutral[500]}
                  value={location}
                  onChangeText={setLocation}
                  editable={!posting}
                />
              </View>
            )}

            {mediaFiles.length > 0 && (
              <ScrollView horizontal style={styles.mediaPreview}>
                {mediaFiles.map((media, index) => (
                  <View key={index} style={styles.mediaItem}>
                    <Image source={{ uri: media.uri }} style={styles.mediaImage} />
                    <TouchableOpacity
                      style={styles.removeMediaButton}
                      onPress={() => removeMedia(index)}
                      disabled={posting}
                    >
                      <X color={colors.neutral[0]} size={16} />
                    </TouchableOpacity>
                    {media.type === 'video' && (
                      <View style={styles.videoIndicator}>
                        <Video color={colors.neutral[0]} size={24} />
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={pickImage}
                disabled={posting}
              >
                <ImageIcon color={colors.accent[600]} size={24} />
                <Text style={styles.actionText}>Fotoğraf</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={pickVideo}
                disabled={posting}
              >
                <Video color={colors.accent[600]} size={24} />
                <Text style={styles.actionText}>Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowLocationInput(!showLocationInput)}
                disabled={posting}
              >
                <MapPin color={colors.accent[600]} size={24} />
                <Text style={styles.actionText}>Konum</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.postButton, posting && styles.disabled]}
              onPress={handlePost}
              disabled={posting}
            >
              <Send color={colors.neutral[0]} size={20} />
              <Text style={styles.postButtonText}>
                {posting 
                  ? (editPost ? 'Güncelleniyor...' : 'Gönderiliyor...') 
                  : (editPost ? 'Güncelle' : 'Paylaş')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.secondary[100],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: typographyColors.primary,
  },
  content: {
    padding: 20,
    maxHeight: 400,
  },
  textInput: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.secondary[200],
    borderRadius: 12,
    padding: 16,
    color: typographyColors.primary,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.secondary[200],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  locationInput: {
    flex: 1,
    color: typographyColors.primary,
    fontSize: 16,
    marginLeft: 8,
  },
  mediaPreview: {
    marginBottom: 16,
  },
  mediaItem: {
    position: 'relative',
    marginRight: 12,
  },
  mediaImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.status.error,
    borderRadius: 12,
    padding: 4,
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.secondary[200],
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: typographyColors.secondary,
    fontSize: 12,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent[600],
    borderRadius: 12,
    padding: 16,
  },
  postButtonText: {
    color: colors.neutral[0],
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.6,
  },
});
