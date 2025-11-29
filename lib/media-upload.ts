import { supabase } from './supabase';
import { Platform } from 'react-native';

export interface UploadResult {
  url: string;
  path: string;
}

// MIME type'dan dosya uzantısını çıkar
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
  };
  return mimeToExt[mimeType.toLowerCase()] || 'jpg';
}

// URI'den dosya uzantısını çıkar
function getFileExtension(uri: string): string {
  // Data URI ise MIME type'dan uzantıyı çıkar
  if (uri.startsWith('data:')) {
    const mimeMatch = uri.match(/data:([^;]+)/);
    if (mimeMatch && mimeMatch[1]) {
      return getExtensionFromMimeType(mimeMatch[1]);
    }
    return 'jpg'; // Varsayılan
  }
  
  // Normal URI ise dosya adından uzantıyı çıkar
  const parts = uri.split('.');
  if (parts.length > 1) {
    const ext = parts.pop()?.split('?')[0]?.toLowerCase();
    if (ext && ext.length <= 5) { // Geçerli uzantı kontrolü
      return ext;
    }
  }
  
  return 'jpg'; // Varsayılan
}

export async function uploadMedia(
  uri: string,
  userId: string,
  type: 'image' | 'video' | 'audio'
): Promise<UploadResult> {
  try {
    const fileExt = getFileExtension(uri);
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${type}s/${fileName}`;

    let fileData: Blob | Uint8Array | File;
    let mimeType: string;

    if (Platform.OS === 'web') {
      // Web platformu için
      if (uri.startsWith('data:')) {
        // Data URI ise (base64)
        const mimeMatch = uri.match(/data:([^;]+)/);
        mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        
        const base64Data = uri.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        fileData = bytes;
      } else if (uri.startsWith('blob:')) {
        // Blob URL ise
        const response = await fetch(uri);
        fileData = await response.blob();
        mimeType = fileData.type || getMimeType(fileExt);
      } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
        // HTTP URL ise
        const response = await fetch(uri);
        fileData = await response.blob();
        mimeType = fileData.type || getMimeType(fileExt);
      } else {
        // Local file path (web'de genelde File objesi gelir)
        // Eğer File objesi direkt gelirse onu kullan
        throw new Error('Unsupported file URI format for web');
      }
    } else {
      // Mobil platformlar için
      const FileSystem = require('expo-file-system');
      
      // Legacy API kullan (deprecated ama çalışıyor)
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType?.Base64 || 'base64',
      });

      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      fileData = bytes;
      mimeType = getMimeType(fileExt);
    }

    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, fileData, {
        contentType: mimeType || getMimeType(fileExt),
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}

export async function deleteMedia(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('media')
      .remove([path]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
}

function getMimeType(ext: string): string {
  const mimeTypes: { [key: string]: string } = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
