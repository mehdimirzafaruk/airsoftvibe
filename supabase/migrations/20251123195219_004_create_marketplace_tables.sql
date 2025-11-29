/*
  # Marketplace ve Reklam Tabloları

  ## Yeni Tablolar
  
  ### 1. marketplace_items (Pazar Yeri Ürünleri)
  - id (uuid, primary key)
  - seller_id (uuid, foreign key -> profiles.id)
  - title (text) - Ürün başlığı
  - description (text) - Ürün açıklaması
  - price (decimal) - Fiyat
  - currency (text) - Para birimi
  - category (text) - Kategori
  - condition (text) - Durum
  - images (jsonb) - Ürün resimleri
  - location (text) - Konum
  - status (text) - active, sold, expired
  - view_count (int) - Görüntülenme sayısı
  - created_at, updated_at
  
  ### 2. marketplace_favorites (Favoriler)
  - id (uuid, primary key)
  - user_id (uuid, foreign key -> profiles.id)
  - item_id (uuid, foreign key -> marketplace_items.id)
  - created_at
  
  ### 3. marketplace_messages (Ürün Mesajları)
  - id (uuid, primary key)
  - item_id (uuid, foreign key -> marketplace_items.id)
  - sender_id (uuid, foreign key -> profiles.id)
  - receiver_id (uuid, foreign key -> profiles.id)
  - message (text)
  - created_at
  
  ### 4. advertisements (Reklamlar)
  - id (uuid, primary key)
  - title (text) - Reklam başlığı
  - image_url (text) - Reklam görseli
  - link_url (text) - Reklam linki
  - type (text) - banner, native, interstitial
  - position (text) - home_top, home_middle, feed, profile
  - priority (int) - Öncelik
  - start_date, end_date - Yayın tarihleri
  - status (text) - active, paused, expired
  - click_count (int) - Tıklanma sayısı
  - view_count (int) - Görüntülenme sayısı
  - created_at, updated_at
  
  ### 5. ad_clicks (Reklam Tıklamaları)
  - id (uuid, primary key)
  - ad_id (uuid, foreign key -> advertisements.id)
  - user_id (uuid, foreign key -> profiles.id)
  - clicked_at

  ## Güvenlik
  - RLS tüm tablolarda etkin
  - Kullanıcılar kendi ürünlerini yönetebilir
  - Reklamlar herkese görünür
*/

-- Marketplace items tablosu
CREATE TABLE IF NOT EXISTS marketplace_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  currency text DEFAULT 'TL' CHECK (currency IN ('TL', 'USD', 'EUR')),
  category text NOT NULL,
  condition text DEFAULT 'used' CHECK (condition IN ('new', 'like_new', 'used', 'for_parts')),
  images jsonb DEFAULT '[]'::jsonb,
  location text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired')),
  view_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active items"
  ON marketplace_items FOR SELECT
  TO authenticated
  USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Users can create items"
  ON marketplace_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own items"
  ON marketplace_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own items"
  ON marketplace_items FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Marketplace favorites tablosu
CREATE TABLE IF NOT EXISTS marketplace_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_id uuid REFERENCES marketplace_items(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE marketplace_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON marketplace_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON marketplace_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON marketplace_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Marketplace messages tablosu
CREATE TABLE IF NOT EXISTS marketplace_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES marketplace_items(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages they sent or received"
  ON marketplace_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON marketplace_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Advertisements tablosu
CREATE TABLE IF NOT EXISTS advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  link_url text,
  type text DEFAULT 'banner' CHECK (type IN ('banner', 'native', 'interstitial')),
  position text DEFAULT 'home_top' CHECK (position IN ('home_top', 'home_middle', 'feed', 'profile', 'marketplace')),
  priority int DEFAULT 0,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
  click_count int DEFAULT 0,
  view_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active ads"
  ON advertisements FOR SELECT
  TO authenticated
  USING (status = 'active' AND start_date <= now() AND (end_date IS NULL OR end_date >= now()));

-- Ad clicks tablosu
CREATE TABLE IF NOT EXISTS ad_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid REFERENCES advertisements(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  clicked_at timestamptz DEFAULT now()
);

ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert ad clicks"
  ON ad_clicks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_marketplace_items_updated_at
  BEFORE UPDATE ON marketplace_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advertisements_updated_at
  BEFORE UPDATE ON advertisements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
