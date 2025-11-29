/*
  # Profiles Tablosuna Telefon Numarası Kolonu Ekleme
  
  ## Değişiklikler
  - profiles tablosuna phone kolonu eklendi
  - Telefon numarası opsiyonel (NULL olabilir)
*/

-- Phone kolonu ekle
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone text;

-- Telefon numarası için unique constraint ekle (NULL değerler hariç)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx 
ON profiles(phone) 
WHERE phone IS NOT NULL;

-- Comment ekle
COMMENT ON COLUMN profiles.phone IS 'Telefon numarası (E.164 formatında: +905551234567)';


