/*
  # Etkinlik Tabloları

  ## Yeni Tablolar
  
  ### 1. events (Etkinlikler)
  - id (uuid, primary key)
  - creator_id (uuid, foreign key -> profiles.id)
  - title (text) - Etkinlik başlığı
  - description (text) - Açıklama
  - location (text) - Konum
  - event_date (timestamptz) - Etkinlik tarihi
  - max_participants (int) - Maksimum katılımcı
  - image_url (text) - Etkinlik görseli
  - type (text) - game, tournament, training, meetup
  - status (text) - upcoming, ongoing, completed, cancelled
  - created_at, updated_at
  
  ### 2. event_participants (Katılımcılar)
  - id (uuid, primary key)
  - event_id (uuid, foreign key -> events.id)
  - user_id (uuid, foreign key -> profiles.id)
  - status (text) - pending, confirmed, declined
  - joined_at
  
  ### 3. event_group_chats (Etkinlik Grup Sohbetleri)
  - id (uuid, primary key)
  - event_id (uuid, foreign key -> events.id)
  - group_chat_id (uuid, foreign key -> group_chats.id)
  - created_at

  ## Güvenlik
  - RLS tüm tablolarda etkin
  - Katılımcılar etkinlik bilgilerini görebilir
  - Organizatörler etkinlikleri yönetebilir
*/

-- Events tablosu
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  location text NOT NULL,
  event_date timestamptz NOT NULL,
  max_participants int DEFAULT 50,
  image_url text,
  type text DEFAULT 'game' CHECK (type IN ('game', 'tournament', 'training', 'meetup')),
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Event participants tablosu
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'declined')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants of events"
  ON event_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join events"
  ON event_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave events"
  ON event_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON event_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Event group chats tablosu
CREATE TABLE IF NOT EXISTS event_group_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  group_chat_id uuid REFERENCES group_chats(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, group_chat_id)
);

ALTER TABLE event_group_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event participants can view event chats"
  ON event_group_chats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_participants
      WHERE event_participants.event_id = event_group_chats.event_id
      AND event_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Event creators can create event chats"
  ON event_group_chats FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_group_chats.event_id
      AND events.creator_id = auth.uid()
    )
  );

-- Triggers
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
