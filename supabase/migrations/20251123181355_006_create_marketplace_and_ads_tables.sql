/*
  # Marketplace ve Reklam Sistemi Tabloları

  ## Yeni Tablolar
  
  ### 1. marketplace_items (Pazar Yeri Ürünleri)
  - id (uuid, primary key)
  - seller_id (uuid, foreign key -> profiles.id)
  - title (text) - Ürün başlığı
  - description (text) - Ürün açıklaması
  - price (decimal) - Fiyat
  - currency (text) - Para birimi (TL, USD, EUR)
  - category (text) - Kategori
  - condition (text) - Durum (yeni, ikinci el, vs)
  - images (jsonb) - Ürün resimleri
  - location (text) - Konum
  - status (text) - Durum (active, sold, expired)
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
  - type (text) - Reklam tipi (banner, native, interstitial)
  - position (text) - Konum (home_top, home_middle, feed, profile)
  - priority (int) - Öncelik
  - start_date, end_date - Yayın tarihleri
  - status (text) - Durum (active, paused, expired)
  - click_count (int) - Tıklanma sayısı
  - view_count (int) - Görüntülenme sayısı
  - created_at, updated_at
  
  ### 5. ad_clicks (Reklam Tıklamaları)
  - id (uuid, primary key)
  - ad_id (uuid, foreign key -> advertisements.id)
  - user_id (uuid, nullable, foreign key -> profiles.id)
  - clicked_at
  
  ## Güvenlik
  - RLS tüm tablolarda aktif
  - Marketplace: Kullanıcılar kendi ürünlerini yönetebilir
  - Reklamlar: Sadece admin görebilir/yönetebilir
*/

-- Marketplace Items Table
CREATE TABLE IF NOT EXISTS marketplace_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  currency text DEFAULT 'TL' CHECK (currency IN ('TL', 'USD', 'EUR')),
  category text NOT NULL CHECK (category IN ('silah', 'ekipman', 'taktik_malzeme', 'aksesuar', 'koruma', 'giyim', 'diger')),
  condition text NOT NULL CHECK (condition IN ('yeni', 'sifir_gibi', 'kullanilmis', 'tamir_gerekli')),
  images jsonb DEFAULT '[]'::jsonb,
  location text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'removed')),
  view_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Marketplace Favorites
CREATE TABLE IF NOT EXISTS marketplace_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_id uuid REFERENCES marketplace_items(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Marketplace Messages
CREATE TABLE IF NOT EXISTS marketplace_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES marketplace_items(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Advertisements Table
CREATE TABLE IF NOT EXISTS advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  link_url text,
  type text NOT NULL CHECK (type IN ('banner', 'native', 'interstitial')),
  position text NOT NULL CHECK (position IN ('home_top', 'home_middle', 'feed', 'profile', 'marketplace')),
  priority int DEFAULT 0,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
  click_count int DEFAULT 0,
  view_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ad Clicks Table
CREATE TABLE IF NOT EXISTS ad_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid REFERENCES advertisements(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  clicked_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

-- Marketplace Items Policies
CREATE POLICY "Anyone can view active marketplace items"
  ON marketplace_items FOR SELECT
  USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Users can create their own items"
  ON marketplace_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own items"
  ON marketplace_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own items"
  ON marketplace_items FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Marketplace Favorites Policies
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

-- Marketplace Messages Policies
CREATE POLICY "Users can view their messages"
  ON marketplace_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON marketplace_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Advertisements Policies
CREATE POLICY "Anyone can view active ads"
  ON advertisements FOR SELECT
  USING (
    status = 'active' AND
    start_date <= now() AND
    (end_date IS NULL OR end_date >= now())
  );

CREATE POLICY "Only admins can manage ads"
  ON advertisements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Ad Clicks Policies
CREATE POLICY "Users can track ad clicks"
  ON ad_clicks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view ad clicks"
  ON ad_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_items_seller ON marketplace_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_status ON marketplace_items(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_category ON marketplace_items(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_user ON marketplace_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_item ON marketplace_messages(item_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_position ON advertisements(position);
CREATE INDEX IF NOT EXISTS idx_advertisements_status ON advertisements(status);

-- Functions
CREATE OR REPLACE FUNCTION increment_ad_view_count(ad_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE advertisements
  SET view_count = view_count + 1
  WHERE id = ad_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_item_view_count(item_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE marketplace_items
  SET view_count = view_count + 1
  WHERE id = item_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
