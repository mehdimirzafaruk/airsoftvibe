/*
  # Kullanıcı Profilleri ve İlişkili Tablolar

  ## Yeni Tablolar
  
  ### 1. profiles (Kullanıcı Profilleri)
  - id (uuid, primary key, foreign key -> auth.users.id)
  - username (text, unique) - Kullanıcı adı
  - full_name (text) - Tam ad
  - bio (text) - Biyografi
  - avatar_url (text) - Avatar resmi
  - role (text) - Kullanıcı rolü (user, admin, moderator)
  - rank (text) - Rütbe sistemi
  - created_at, updated_at
  
  ### 2. follows (Takip İlişkileri)
  - id (uuid, primary key)
  - follower_id (uuid, foreign key -> profiles.id)
  - following_id (uuid, foreign key -> profiles.id)
  - created_at
  
  ### 3. blocked_users (Engellenen Kullanıcılar)
  - id (uuid, primary key)
  - blocker_id (uuid, foreign key -> profiles.id)
  - blocked_id (uuid, foreign key -> profiles.id)
  - created_at
  
  ### 4. user_privacy_settings (Gizlilik Ayarları)
  - id (uuid, primary key)
  - user_id (uuid, foreign key -> profiles.id)
  - profile_visibility (text) - public, private, friends_only
  - show_online_status (boolean)
  - allow_messages_from (text) - everyone, following, none
  - created_at, updated_at

  ## Güvenlik
  - Tüm tablolarda RLS etkin
  - Kullanıcılar kendi verilerini yönetebilir
  - Admin'ler tüm verileri yönetebilir
*/

-- Profiles tablosu
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  bio text,
  avatar_url text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  rank text DEFAULT 'newbie',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Follows tablosu
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all follows"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Blocked users tablosu
CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks"
  ON blocked_users FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock"
  ON blocked_users FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);

-- User privacy settings tablosu
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  profile_visibility text DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'friends_only')),
  show_online_status boolean DEFAULT true,
  allow_messages_from text DEFAULT 'everyone' CHECK (allow_messages_from IN ('everyone', 'following', 'none')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own privacy settings"
  ON user_privacy_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy settings"
  ON user_privacy_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy settings"
  ON user_privacy_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_privacy_settings_updated_at
  BEFORE UPDATE ON user_privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
