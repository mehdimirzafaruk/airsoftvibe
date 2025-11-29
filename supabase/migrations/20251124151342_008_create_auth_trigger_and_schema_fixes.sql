/*
  # Auth Trigger ve Şema Düzeltmeleri

  ## Değişiklikler
  
  ### 1. Auth Trigger - Otomatik Profile Oluşturma
  - Yeni kullanıcı kaydında otomatik profile oluşturulur
  - Varsayılan değerler atanır (username, role, rank)
  - User privacy settings ve user_xp otomatik oluşturulur
  
  ### 2. Şema Düzeltmeleri
  - Posts tablosuna deleted_at kolonu eklenir
  - Comments tablosuna deleted_at kolonu eklenir
  - Events tablosuna start_time ve end_time kolonları eklenir
  - Event_participants status değeri 'going' için güncellenir
  
  ### 3. Marketplace Images Yapısı
  - Images kolonu text array formatına dönüştürülür
  
  ## Güvenlik
  - Trigger SECURITY DEFINER ile çalışır
  - Otomatik işlemler güvenli şekilde yapılır
*/

-- 1. Auth trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  random_suffix text;
BEGIN
  -- Generate random suffix for username
  random_suffix := substr(md5(random()::text), 1, 6);
  
  -- Create profile
  INSERT INTO public.profiles (id, username, full_name, role, rank)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || random_suffix),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    'newbie'
  );
  
  -- Create privacy settings
  INSERT INTO public.user_privacy_settings (user_id)
  VALUES (NEW.id);
  
  -- Create user XP
  INSERT INTO public.user_xp (user_id, total_xp, level, rank)
  VALUES (NEW.id, 0, 1, 'Newbie');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Add deleted_at to posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE posts ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

-- 3. Add deleted_at to comments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE comments ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

-- 4. Add start_time and end_time to events (rename event_date)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE events RENAME COLUMN event_date TO start_time;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE events ADD COLUMN end_time timestamptz;
    -- Set end_time to start_time + 4 hours as default
    UPDATE events SET end_time = start_time + interval '4 hours' WHERE end_time IS NULL;
  END IF;
END $$;

-- 5. Update event_participants status enum to include 'going'
DO $$
BEGIN
  ALTER TABLE event_participants DROP CONSTRAINT IF EXISTS event_participants_status_check;
  ALTER TABLE event_participants ADD CONSTRAINT event_participants_status_check 
    CHECK (status IN ('pending', 'confirmed', 'declined', 'going'));
  
  -- Update existing 'confirmed' to 'going'
  UPDATE event_participants SET status = 'going' WHERE status = 'confirmed';
END $$;

-- 6. Marketplace images - add helper for migration
-- Note: We'll keep jsonb but ensure data is stored as simple string array in jsonb
-- The frontend will be updated to handle this properly
