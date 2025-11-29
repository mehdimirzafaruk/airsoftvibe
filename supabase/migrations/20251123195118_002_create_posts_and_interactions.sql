/*
  # Post ve Etkileşim Tabloları

  ## Yeni Tablolar
  
  ### 1. posts (Gönderiler)
  - id (uuid, primary key)
  - user_id (uuid, foreign key -> profiles.id)
  - content (text) - Gönderi içeriği
  - media_urls (jsonb) - Medya dosyaları
  - media_type (text) - image, video, none
  - hashtags (text[]) - Hashtag'ler
  - location (text) - Konum
  - visibility (text) - public, private, followers_only
  - created_at, updated_at
  
  ### 2. comments (Yorumlar)
  - id (uuid, primary key)
  - post_id (uuid, foreign key -> posts.id)
  - user_id (uuid, foreign key -> profiles.id)
  - parent_comment_id (uuid, foreign key -> comments.id) - İç içe yorumlar
  - content (text) - Yorum içeriği
  - created_at, updated_at
  
  ### 3. likes (Beğeniler)
  - id (uuid, primary key)
  - post_id (uuid, foreign key -> posts.id)
  - user_id (uuid, foreign key -> profiles.id)
  - created_at
  
  ### 4. post_saves (Kaydedilenler)
  - id (uuid, primary key)
  - post_id (uuid, foreign key -> posts.id)
  - user_id (uuid, foreign key -> profiles.id)
  - created_at
  
  ### 5. post_reports (Şikayetler)
  - id (uuid, primary key)
  - post_id (uuid, foreign key -> posts.id)
  - reported_by (uuid, foreign key -> profiles.id)
  - reason (text)
  - status (text) - pending, reviewed, resolved
  - created_at

  ## Güvenlik
  - RLS tüm tablolarda etkin
  - Kullanıcılar kendi içeriklerini yönetebilir
  - Görünürlük kontrolü yapılır
*/

-- Posts tablosu
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text,
  media_urls jsonb DEFAULT '[]'::jsonb,
  media_type text DEFAULT 'none' CHECK (media_type IN ('image', 'video', 'none')),
  hashtags text[] DEFAULT '{}'::text[],
  location text,
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'followers_only')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public posts"
  ON posts FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (visibility = 'followers_only' AND EXISTS (
      SELECT 1 FROM follows WHERE following_id = posts.user_id AND follower_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments tablosu
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on visible posts"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = comments.post_id
      AND (
        posts.visibility = 'public'
        OR posts.user_id = auth.uid()
        OR (posts.visibility = 'followers_only' AND EXISTS (
          SELECT 1 FROM follows WHERE following_id = posts.user_id AND follower_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can insert comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Likes tablosu
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view likes on visible posts"
  ON likes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = likes.post_id
      AND (
        posts.visibility = 'public'
        OR posts.user_id = auth.uid()
        OR (posts.visibility = 'followers_only' AND EXISTS (
          SELECT 1 FROM follows WHERE following_id = posts.user_id AND follower_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can like posts"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Post saves tablosu
CREATE TABLE IF NOT EXISTS post_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saves"
  ON post_saves FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
  ON post_saves FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
  ON post_saves FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Post reports tablosu
CREATE TABLE IF NOT EXISTS post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  reported_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, reported_by)
);

ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON post_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reported_by);

CREATE POLICY "Users can report posts"
  ON post_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

-- Triggers
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
