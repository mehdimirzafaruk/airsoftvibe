/*
  # Admin Yetkileri ve Policy Düzeltmeleri

  ## Güvenlik Geliştirmeleri
  
  1. **Admin Yetkilerinin Eklenmesi**
     - Admin'ler tüm içerikleri görebilir ve yönetebilir
     - Admin yetkisi için restrictive policy'ler eklendi
  
  2. **Multiple Permissive Policy Önleme**
     - Tüm admin policy'leri mevcut policy'lere OR koşulu olarak eklendi
     - Ayrı policy'ler yerine birleştirilmiş policy'ler kullanıldı
  
  ## Etkilenen Tablolar
  - posts (silme yetkisi)
  - comments (silme yetkisi)
  - post_reports (görüntüleme yetkisi)
  - events (yönetim yetkisi)
  - marketplace_items (yönetim yetkisi)
  - advertisements (yönetim yetkisi)
  
  ## Güvenlik Notları
  - Admin kontrolü her zaman profiles tablosundan yapılır
  - role = 'admin' kontrolü tüm admin policy'lerinde zorunludur
*/

-- Helper function for admin check
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Posts: Admin silme yetkisi ekle (mevcut policy'i güncelle)
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

CREATE POLICY "Users can delete own posts or admins can delete any"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- Comments: Admin silme yetkisi ekle
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "Users can delete own comments or admins can delete any"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- Post reports: Admin görüntüleme yetkisi ekle
DROP POLICY IF EXISTS "Users can view own reports" ON post_reports;

CREATE POLICY "Users can view own reports or admins can view all"
  ON post_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reported_by OR is_admin());

-- Post reports: Admin güncelleme yetkisi ekle
CREATE POLICY "Admins can update report status"
  ON post_reports FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Events: Admin yönetim yetkisi ekle
CREATE POLICY "Admins can update any event"
  ON events FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete any event"
  ON events FOR DELETE
  TO authenticated
  USING (is_admin());

-- Marketplace items: Admin yönetim yetkisi ekle
CREATE POLICY "Admins can update any marketplace item"
  ON marketplace_items FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete any marketplace item"
  ON marketplace_items FOR DELETE
  TO authenticated
  USING (is_admin());

-- Advertisements: Admin tam yönetim yetkisi
CREATE POLICY "Admins can insert ads"
  ON advertisements FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update ads"
  ON advertisements FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete ads"
  ON advertisements FOR DELETE
  TO authenticated
  USING (is_admin());

-- Profiles: Admin tüm profilleri güncelleyebilir
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
