/*
  # Bildirim Sistemi

  ## Yeni Tablolar
  
  ### 1. notifications (Bildirimler)
  - id (uuid, primary key)
  - user_id (uuid, foreign key -> profiles.id) - Bildirim alacak kullanıcı
  - type (text) - Bildirim tipi
  - title (text) - Bildirim başlığı
  - message (text) - Bildirim mesajı
  - data (jsonb) - Ek bilgiler
  - is_read (boolean) - Okundu mu?
  - action_url (text) - Tıklandığında gidilecek yer
  - created_at (timestamptz)
  
  ### 2. notification_settings (Bildirim Ayarları)
  - user_id (uuid, primary key)
  - Bildirim türleri için ayarlar
*/

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention', 'event', 'message', 'system', 'marketplace')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

-- Notification Settings Table
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  likes_enabled boolean DEFAULT true,
  comments_enabled boolean DEFAULT true,
  follows_enabled boolean DEFAULT true,
  mentions_enabled boolean DEFAULT true,
  events_enabled boolean DEFAULT true,
  messages_enabled boolean DEFAULT true,
  system_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Notification Settings Policies
CREATE POLICY "Users can view own settings"
  ON notification_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON notification_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can create own settings"
  ON notification_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Function: Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id uuid)
RETURNS int AS $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*)::int INTO v_count
  FROM notifications
  WHERE user_id = p_user_id AND is_read = false;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
