/*
  # Storage Bucket Politikaları

  ## Amaç
  - `media` bucket'ı için RLS politikaları oluşturuluyor
  - Kullanıcılar kendi klasörlerine dosya yükleyebilir
  - Kullanıcılar kendi dosyalarını silebilir
  - Herkes public dosyaları görüntüleyebilir

  ## ÖNEMLİ: Önce Supabase Dashboard'dan Storage bölümünde 'media' bucket'ını oluşturun!
  ## Dashboard > Storage > New bucket > Name: 'media', Public: true

  ## Güvenlik
  - Kullanıcılar sadece kendi klasörlerine (userId/images, userId/videos, vb.) yazabilir
  - Kullanıcılar sadece kendi dosyalarını silebilir
  - Public okuma izni var (getPublicUrl için)
*/

-- Storage objects için RLS politikaları
-- Önce mevcut policy'leri temizle (eğer varsa)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- SELECT: Herkes public dosyaları görüntüleyebilir
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media');

-- INSERT: Kullanıcılar sadece kendi klasörlerine dosya yükleyebilir
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media' AND
    (name ~ ('^' || auth.uid()::text || '/'))
  );

-- UPDATE: Kullanıcılar sadece kendi dosyalarını güncelleyebilir
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'media' AND
    (name ~ ('^' || auth.uid()::text || '/'))
  )
  WITH CHECK (
    bucket_id = 'media' AND
    (name ~ ('^' || auth.uid()::text || '/'))
  );

-- DELETE: Kullanıcılar sadece kendi dosyalarını silebilir
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media' AND
    (name ~ ('^' || auth.uid()::text || '/'))
  );

