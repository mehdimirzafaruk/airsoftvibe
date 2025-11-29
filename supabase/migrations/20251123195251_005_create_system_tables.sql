/*
  # Sistem Tabloları (Bildirimler, Admin, XP)

  ## Yeni Tablolar
  
  ### 1. notifications (Bildirimler)
  - id (uuid, primary key)
  - user_id (uuid, foreign key -> profiles.id)
  - type (text) - like, comment, follow, event, marketplace
  - title (text) - Bildirim başlığı
  - message (text) - Bildirim mesajı
  - related_id (uuid) - İlgili içerik ID'si
  - related_type (text) - post, event, item
  - is_read (boolean) - Okundu mu
  - created_at
  
  ### 2. user_xp (Kullanıcı XP)
  - id (uuid, primary key)
  - user_id (uuid, foreign key -> profiles.id)
  - total_xp (int) - Toplam XP
  - level (int) - Seviye
  - rank (text) - Rütbe
  - updated_at
  
  ### 3. xp_transactions (XP İşlemleri)
  - id (uuid, primary key)
  - user_id (uuid, foreign key -> profiles.id)
  - amount (int) - XP miktarı
  - reason (text) - Sebep
  - created_at
  
  ### 4. admin_actions (Admin İşlemleri)
  - id (uuid, primary key)
  - admin_id (uuid, foreign key -> profiles.id)
  - action_type (text) - ban_user, delete_post, feature_content
  - target_id (uuid) - Hedef ID
  - target_type (text) - user, post, event
  - reason (text) - Sebep
  - created_at
  
  ### 5. user_data_exports (Veri Dışa Aktarımları)
  - id (uuid, primary key)
  - user_id (uuid, foreign key -> profiles.id)
  - status (text) - pending, processing, completed, failed
  - file_url (text) - İndirme linki
  - requested_at, completed_at

  ## Güvenlik
  - RLS tüm tablolarda etkin
  - Kullanıcılar kendi bildirimlerini görür
  - Admin işlemleri sadece admin'ler tarafından yapılabilir
*/

-- Notifications tablosu
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'event', 'marketplace', 'system')),
  title text NOT NULL,
  message text,
  related_id uuid,
  related_type text CHECK (related_type IN ('post', 'event', 'item', 'user')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User XP tablosu
CREATE TABLE IF NOT EXISTS user_xp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_xp int DEFAULT 0,
  level int DEFAULT 1,
  rank text DEFAULT 'Newbie',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all XP data"
  ON user_xp FOR SELECT
  TO authenticated
  USING (true);

-- XP transactions tablosu
CREATE TABLE IF NOT EXISTS xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount int NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own XP transactions"
  ON xp_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin actions tablosu
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('ban_user', 'delete_post', 'delete_comment', 'feature_content', 'resolve_report')),
  target_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('user', 'post', 'comment', 'event', 'item')),
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view admin actions"
  ON admin_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert admin actions"
  ON admin_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- User data exports tablosu
CREATE TABLE IF NOT EXISTS user_data_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url text,
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE user_data_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data exports"
  ON user_data_exports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can request data exports"
  ON user_data_exports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_xp_leaderboard ON user_xp(total_xp DESC, level DESC);
