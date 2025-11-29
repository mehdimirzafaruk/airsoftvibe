/*
  # Tüm Demo Verileri - Kapsamlı
  
  Bu dosya tüm demo verilerini içerir:
  - Kullanıcı profilleri (auth.users tablosuna manuel ekleme gerekir)
  - Gönderiler
  - Yorumlar ve beğeniler
  - Etkinlikler
  - Marketplace ürünleri
  - Reklamlar
  - XP ve rank verileri
  - Etkinlik katılımları
  
  ## Kullanım:
  1. Supabase Dashboard > SQL Editor'e gidin
  2. Bu dosyanın içeriğini kopyalayıp yapıştırın
  3. Çalıştırın
  
  ## Not:
  - auth.users tablosuna kullanıcıları manuel eklemeniz veya uygulama üzerinden kayıt yapmanız gerekir
  - Eğer kullanıcılar zaten varsa, bu script mevcut kullanıcıları kullanır
  - Not: profiles tablosunda team_info ve favorite_equipment kolonları yok, bu bilgiler bio alanına eklenmiştir
  - Not: posts tablosunda hashtags kolonu text[] (text array) formatında, jsonb değil
*/

-- Mevcut demo verilerini temizle (opsiyonel)
DO $$
DECLARE
  demo_usernames text[] := ARRAY['ahmet_sniper', 'ayse_tactical', 'mehmet_assault', 'zeynep_support', 'admin'];
  demo_user_ids uuid[];
BEGIN
  SELECT ARRAY_AGG(id) INTO demo_user_ids FROM profiles WHERE username = ANY(demo_usernames);
  IF demo_user_ids IS NOT NULL AND array_length(demo_user_ids, 1) > 0 THEN
    DELETE FROM event_participants WHERE user_id = ANY(demo_user_ids);
    DELETE FROM likes WHERE user_id = ANY(demo_user_ids);
    DELETE FROM comments WHERE user_id = ANY(demo_user_ids);
    DELETE FROM posts WHERE user_id = ANY(demo_user_ids);
    DELETE FROM marketplace_items WHERE seller_id = ANY(demo_user_ids);
    DELETE FROM events WHERE creator_id = ANY(demo_user_ids);
    DELETE FROM user_xp WHERE user_id = ANY(demo_user_ids);
    DELETE FROM direct_messages WHERE sender_id = ANY(demo_user_ids) OR recipient_id = ANY(demo_user_ids);
    DELETE FROM profiles WHERE id = ANY(demo_user_ids);
  END IF;
END $$;

-- Demo kullanıcı profilleri (auth.users tablosunda kullanıcılar olmalı)
-- ÖNEMLİ: Bu script sadece mevcut kullanıcıları kullanır. Eğer hiç kullanıcı yoksa, önce uygulama üzerinden kayıt yapın veya Supabase Dashboard'dan ekleyin
DO $$
DECLARE
  user1_id uuid;
  user2_id uuid;
  user3_id uuid;
  user4_id uuid;
  user5_id uuid;
  existing_user_count int;
BEGIN
  -- Mevcut kullanıcı sayısını kontrol et (auth.users tablosundan)
  SELECT COUNT(*) INTO existing_user_count FROM auth.users;
  
  -- Eğer hiç kullanıcı yoksa, uyarı ver ve çık
  IF existing_user_count = 0 THEN
    RAISE NOTICE 'UYARI: auth.users tablosunda hiç kullanıcı yok. Demo verileri eklemek için önce kullanıcı oluşturmanız gerekiyor.';
    RAISE NOTICE 'Lütfen önce uygulama üzerinden kayıt yapın veya Supabase Dashboard > Authentication > Users > Add User ile kullanıcı ekleyin.';
    RETURN;
  END IF;
  
  -- Mevcut kullanıcıları kullan (auth.users'dan gelen ID'ler)
  -- Önce auth.users'dan ID'leri al, sonra profiles'da var mı kontrol et
  SELECT id INTO user1_id FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO user2_id FROM auth.users WHERE id != COALESCE(user1_id, '00000000-0000-0000-0000-000000000000') ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO user3_id FROM auth.users WHERE id NOT IN (COALESCE(user1_id, '00000000-0000-0000-0000-000000000000'), COALESCE(user2_id, '00000000-0000-0000-0000-000000000000')) ORDER BY created_at LIMIT 1 OFFSET 2;
  SELECT id INTO user4_id FROM auth.users WHERE id NOT IN (COALESCE(user1_id, '00000000-0000-0000-0000-000000000000'), COALESCE(user2_id, '00000000-0000-0000-0000-000000000000'), COALESCE(user3_id, '00000000-0000-0000-0000-000000000000')) ORDER BY created_at LIMIT 1 OFFSET 3;
  SELECT id INTO user5_id FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 4;
  
  -- Eğer profiles'da yoksa, demo profilleri oluştur
  -- Not: team_info ve favorite_equipment kolonları profiles tablosunda yok, bu bilgiler bio'ya eklenmiştir
  IF user1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = user1_id) THEN
    INSERT INTO profiles (id, username, full_name, bio, role, avatar_url) VALUES
      (user1_id, 'ahmet_sniper', 'Ahmet Yılmaz', 'Airsoft tutkunu, sniper uzmanı. 5 yıldır aktif oyuncuyum. Takım: Ankara Wolves. Favori Ekipman: VSR-10 Sniper', 'user', 'https://images.pexels.com/photos/1416530/pexels-photo-1416530.jpeg?auto=compress&w=150')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  IF user2_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = user2_id) THEN
    INSERT INTO profiles (id, username, full_name, bio, role, avatar_url) VALUES
      (user2_id, 'ayse_tactical', 'Ayşe Demir', 'Taktik sevdalısı, CQB uzmanı. Kadın oyuncuları teşvik ediyorum! Takım: İstanbul Ravens. Favori Ekipman: MP5 SMG', 'user', 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&w=150')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  IF user3_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = user3_id) THEN
    INSERT INTO profiles (id, username, full_name, bio, role, avatar_url) VALUES
      (user3_id, 'mehmet_assault', 'Mehmet Kaya', 'Assault rifle seviyorum, açık alan oyunları favorim. Takım: İzmir Spartans. Favori Ekipman: M4A1 Carbine', 'user', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&w=150')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  IF user4_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = user4_id) THEN
    INSERT INTO profiles (id, username, full_name, bio, role, avatar_url) VALUES
      (user4_id, 'zeynep_support', 'Zeynep Arslan', 'Support gunner, ağır silah tutkunu. Takım oyununa inanıyorum. Takım: Bursa Vipers. Favori Ekipman: M249 SAW', 'user', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&w=150')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  IF user5_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = user5_id) THEN
    INSERT INTO profiles (id, username, full_name, bio, role, avatar_url) VALUES
      (user5_id, 'admin', 'Admin', 'Airsoft Vibe platformunun yöneticisi', 'admin', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&w=150')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  -- Profilleri tekrar al (güncel haliyle)
  SELECT id INTO user1_id FROM profiles ORDER BY created_at LIMIT 1;
  SELECT id INTO user2_id FROM profiles WHERE id != COALESCE(user1_id, '00000000-0000-0000-0000-000000000000') ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO user3_id FROM profiles WHERE id NOT IN (COALESCE(user1_id, '00000000-0000-0000-0000-000000000000'), COALESCE(user2_id, '00000000-0000-0000-0000-000000000000')) ORDER BY created_at LIMIT 1 OFFSET 2;
  SELECT id INTO user4_id FROM profiles WHERE id NOT IN (COALESCE(user1_id, '00000000-0000-0000-0000-000000000000'), COALESCE(user2_id, '00000000-0000-0000-0000-000000000000'), COALESCE(user3_id, '00000000-0000-0000-0000-000000000000')) ORDER BY created_at LIMIT 1 OFFSET 3;
  SELECT id INTO user5_id FROM profiles WHERE role = 'admin' LIMIT 1;
  IF user5_id IS NULL THEN
    SELECT id INTO user5_id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 4;
  END IF;
  
  -- XP verileri
  IF user1_id IS NOT NULL THEN
    INSERT INTO user_xp (user_id, total_xp, rank) VALUES
      (user1_id, 1250, 'Kıdemli'),
      (COALESCE(user2_id, user1_id), 850, 'Operatör'),
      (COALESCE(user3_id, user1_id), 450, 'Nişancı'),
      (COALESCE(user4_id, user1_id), 2800, 'Usta'),
      (COALESCE(user5_id, user1_id), 5500, 'Kırmızı Gölge')
    ON CONFLICT (user_id) DO UPDATE SET total_xp = EXCLUDED.total_xp, rank = EXCLUDED.rank;
  END IF;
END $$;

-- Demo Gönderiler
DO $$
DECLARE
  user1_id uuid;
  user2_id uuid;
  user3_id uuid;
  user4_id uuid;
BEGIN
  SELECT id INTO user1_id FROM profiles WHERE username = 'ahmet_sniper' OR username IS NOT NULL ORDER BY created_at LIMIT 1;
  SELECT id INTO user2_id FROM profiles WHERE (username = 'ayse_tactical' OR username IS NOT NULL) AND id != COALESCE(user1_id, '00000000-0000-0000-0000-000000000000') ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO user3_id FROM profiles WHERE (username = 'mehmet_assault' OR username IS NOT NULL) AND id NOT IN (COALESCE(user1_id, '00000000-0000-0000-0000-000000000000'), COALESCE(user2_id, '00000000-0000-0000-0000-000000000000')) ORDER BY created_at LIMIT 1 OFFSET 2;
  SELECT id INTO user4_id FROM profiles WHERE (username = 'zeynep_support' OR username IS NOT NULL) AND id NOT IN (COALESCE(user1_id, '00000000-0000-0000-0000-000000000000'), COALESCE(user2_id, '00000000-0000-0000-0000-000000000000'), COALESCE(user3_id, '00000000-0000-0000-0000-000000000000')) ORDER BY created_at LIMIT 1 OFFSET 3;
  
  IF user1_id IS NOT NULL THEN
    INSERT INTO posts (user_id, content, media_urls, location, created_at, hashtags) VALUES
      (user1_id, 'Bugün harika bir sahada oynadık! VSR-10 ile 50 metreden isabetler aldım. #sniper #airsoft', 
       '["https://images.pexels.com/photos/1474996/pexels-photo-1474996.jpeg?auto=compress&w=600"]'::jsonb, 
       'Ankara - Gölbaşı Sahası', now() - interval '2 hours',
       ARRAY['sniper', 'airsoft']),
      (user1_id, 'Ghillie suit yeni aldım, kamuflaj testi başarılı! Kimse göremedi.', 
       '["https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg?auto=compress&w=600"]'::jsonb, 
       NULL, now() - interval '1 day',
       ARRAY['ghillie', 'camouflage']),
      (user1_id, 'Scope ayarları: Önce 25m mesafede sıfırlayın, sonra 50m test.', 
       '[]'::jsonb, NULL, now() - interval '3 days',
       ARRAY['sniper', 'tips']),
      (user1_id, 'Gece oyunu için NVG aldım. Gece görüşü deneyimi bambaşka!', 
       '[]'::jsonb, NULL, now() - interval '6 days',
       ARRAY['nvg', 'night_game'])
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF user2_id IS NOT NULL THEN
    INSERT INTO posts (user_id, content, media_urls, location, created_at, hashtags) VALUES
      (user2_id, 'Yeni ekipmanlarım geldi! Tactical vest ve kask seti çok kaliteli. #gear #tactical', 
       '["https://images.pexels.com/photos/163407/bomb-attack-soldiers-warriors-163407.jpeg?auto=compress&w=600"]'::jsonb, 
       'İstanbul', now() - interval '5 hours',
       ARRAY['gear', 'tactical']),
      (user2_id, 'CQB taktikleri eğitimi veriyorum. İlgilenen varsa mesaj atabilir!', 
       '[]'::jsonb, 'İstanbul', now() - interval '1 day',
       ARRAY['cqb', 'training']),
      (user2_id, 'Kadın oyuncu sayımız artıyor! Birlikte daha güçlüyüz.', 
       '["https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg?auto=compress&w=600"]'::jsonb, 
       NULL, now() - interval '3 days',
       ARRAY['women', 'community']),
      (user2_id, 'Speedsoft değil, milsim seviyoruz! Gerçekçi taktikler.', 
       '[]'::jsonb, NULL, now() - interval '7 days',
       ARRAY['milsim', 'tactics'])
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF user3_id IS NOT NULL THEN
    INSERT INTO posts (user_id, content, media_urls, location, created_at, hashtags) VALUES
      (user3_id, 'Hafta sonu maçına hazırlanıyorum. M4 temizliği yapıldı, bataryalar şarjda! Kim geliyor?', 
       '[]'::jsonb, NULL, now() - interval '8 hours',
       ARRAY['m4', 'preparation']),
      (user3_id, 'Yeni hop-up ayarı yaptım, menzil 10 metre arttı! BB kalitesi önemli.', 
       '[]'::jsonb, NULL, now() - interval '2 days',
       ARRAY['hopup', 'upgrade']),
      (user3_id, 'M4 ima yeni red dot sight taktım. Harika çalışıyor!', 
       '["https://images.pexels.com/photos/209948/pexels-photo-209948.jpeg?auto=compress&w=600"]'::jsonb, 
       NULL, now() - interval '4 days',
       ARRAY['reddot', 'upgrade']),
      (user3_id, 'Yeni saha keşfi: Sakarya da harika bir orman sahası!', 
       '["https://images.pexels.com/photos/416779/pexels-photo-416779.jpeg?auto=compress&w=600"]'::jsonb, 
       'Sakarya', now() - interval '8 days',
       ARRAY['field', 'discovery'])
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF user4_id IS NOT NULL THEN
    INSERT INTO posts (user_id, content, media_urls, location, created_at, hashtags) VALUES
      (user4_id, 'M249 SAW ile suppressing fire verirken çekilen fotoğraf. Takım oyununun gücü!', 
       '["https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&w=600"]'::jsonb, 
       'Bursa', now() - interval '12 hours',
       ARRAY['m249', 'teamwork']),
      (user4_id, 'Takım olarak ilk maçımızı kazandık! Bursa Vipers en iyisi!', 
       '["https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&w=600"]'::jsonb, 
       'Bursa', now() - interval '2 days',
       ARRAY['team', 'victory']),
      (user4_id, 'Box mag temizliği çok önemli! Düzenli bakım şart.', 
       '[]'::jsonb, NULL, now() - interval '5 days',
       ARRAY['maintenance', 'tips'])
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Yorumlar ve beğeniler
  IF user1_id IS NOT NULL AND user2_id IS NOT NULL THEN
    INSERT INTO comments (post_id, user_id, content) 
    SELECT p.id, user2_id, 'Harika görünüyor! Ben de gelmek isterdim.'
    FROM posts p WHERE p.user_id = user1_id ORDER BY p.created_at DESC LIMIT 1
    ON CONFLICT DO NOTHING;
    
    INSERT INTO likes (post_id, user_id) 
    SELECT p.id, user2_id FROM posts p WHERE p.user_id = user1_id ORDER BY p.created_at DESC LIMIT 2
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF user2_id IS NOT NULL AND user3_id IS NOT NULL THEN
    INSERT INTO likes (post_id, user_id) 
    SELECT p.id, user3_id FROM posts p WHERE p.user_id = user2_id ORDER BY p.created_at DESC LIMIT 2
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Demo Marketplace Ürünleri
DO $$
DECLARE
  seller1_id uuid;
  seller2_id uuid;
BEGIN
  SELECT id INTO seller1_id FROM profiles ORDER BY created_at LIMIT 1;
  SELECT id INTO seller2_id FROM profiles WHERE id != COALESCE(seller1_id, '00000000-0000-0000-0000-000000000000') ORDER BY created_at LIMIT 1 OFFSET 1;
  
  IF seller1_id IS NOT NULL THEN
    INSERT INTO marketplace_items (seller_id, title, description, price, currency, category, condition, images, location, status) VALUES
      (seller1_id, 'Tokyo Marui VSR-10 G-Spec', 'Az kullanılmış. Upgraded hop-up ve 6.01 inner barrel.', 3500.00, 'TL', 'silah', 'kullanilmis', 
       '["https://images.pexels.com/photos/209935/pexels-photo-209935.jpeg?auto=compress&w=400"]'::jsonb, 'Ankara', 'active'),
      (seller1_id, 'Ghillie Suit - Woodland', 'Profesyonel ghillie. L beden.', 850.00, 'TL', 'giyim', 'kullanilmis', 
       '["https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg?auto=compress&w=400"]'::jsonb, 'Ankara', 'active'),
      (seller1_id, 'Red Dot Sight - Replica', 'Kaliteli replika. 20mm rail.', 320.00, 'TL', 'aksesuar', 'sifir_gibi', 
       '["https://images.pexels.com/photos/6193351/pexels-photo-6193351.jpeg?auto=compress&w=400"]'::jsonb, 'Ankara', 'active')
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF seller2_id IS NOT NULL THEN
    INSERT INTO marketplace_items (seller_id, title, description, price, currency, category, condition, images, location, status) VALUES
      (seller2_id, 'Krytac Trident MK2 CRB', 'Fabrika yeni gibi, 3 maçta kullanıldı.', 5200.00, 'TL', 'silah', 'sifir_gibi', 
       '["https://images.pexels.com/photos/209948/pexels-photo-209948.jpeg?auto=compress&w=400"]'::jsonb, 'İstanbul', 'active'),
      (seller2_id, 'Tactical Vest - Multicam', 'Molle sistemli vest. Orta boy.', 450.00, 'TL', 'ekipman', 'kullanilmis', 
       '["https://images.pexels.com/photos/163407/bomb-attack-soldiers-warriors-163407.jpeg?auto=compress&w=400"]'::jsonb, 'İzmir', 'active'),
      (seller2_id, 'Elite Force Glock 17', 'GBB tabanca, 2 şarjör dahil.', 1200.00, 'TL', 'silah', 'kullanilmis', 
       '["https://images.pexels.com/photos/209831/pexels-photo-209831.jpeg?auto=compress&w=400"]'::jsonb, 'İstanbul', 'active'),
      (seller2_id, 'Classic Army M249 Para', 'Electric SAW, 2500 round box mag.', 4800.00, 'TL', 'silah', 'kullanilmis', 
       '["https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&w=400"]'::jsonb, 'Bursa', 'active'),
      (seller2_id, '0.28g BB - 5000 adet', 'Bio BB, açılmamış kutu.', 180.00, 'TL', 'aksesuar', 'yeni', 
       '["https://images.pexels.com/photos/257540/pexels-photo-257540.jpeg?auto=compress&w=400"]'::jsonb, 'Bursa', 'active')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Demo Etkinlikler
DO $$
DECLARE
  creator1_id uuid;
  creator2_id uuid;
  creator3_id uuid;
  creator4_id uuid;
BEGIN
  SELECT id INTO creator1_id FROM profiles ORDER BY created_at LIMIT 1;
  SELECT id INTO creator2_id FROM profiles WHERE id != COALESCE(creator1_id, '00000000-0000-0000-0000-000000000000') ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO creator3_id FROM profiles WHERE id NOT IN (COALESCE(creator1_id, '00000000-0000-0000-0000-000000000000'), COALESCE(creator2_id, '00000000-0000-0000-0000-000000000000')) ORDER BY created_at LIMIT 1 OFFSET 2;
  SELECT id INTO creator4_id FROM profiles WHERE id NOT IN (COALESCE(creator1_id, '00000000-0000-0000-0000-000000000000'), COALESCE(creator2_id, '00000000-0000-0000-0000-000000000000'), COALESCE(creator3_id, '00000000-0000-0000-0000-000000000000')) ORDER BY created_at LIMIT 1 OFFSET 3;
  
  IF creator1_id IS NOT NULL THEN
    INSERT INTO events (title, description, location, start_time, end_time, creator_id, capacity, created_at, status) VALUES
      ('Ankara Büyük Savaş', 'Ayın en büyük etkinliği! 100+ oyuncu.', 'Gölbaşı, Ankara', 
       now() + interval '5 days', now() + interval '5 days' + interval '6 hours', creator1_id, 120, now() - interval '10 days', 'upcoming'),
      ('Sniper Eğitimi', 'Profesyonel sniper taktikleri.', 'Ankara Gölbaşı', 
       now() + interval '8 days', now() + interval '8 days' + interval '4 hours', creator1_id, 20, now() - interval '7 days', 'upcoming')
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF creator2_id IS NOT NULL THEN
    INSERT INTO events (title, description, location, start_time, end_time, creator_id, capacity, created_at, status) VALUES
      ('CQB Antrenman', 'İç mekan CQB eğitimi.', 'İstanbul Kartal', 
       now() + interval '3 days', now() + interval '3 days' + interval '3 hours', creator2_id, 30, now() - interval '5 days', 'upcoming')
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF creator3_id IS NOT NULL THEN
    INSERT INTO events (title, description, location, start_time, end_time, creator_id, capacity, created_at, status) VALUES
      ('Milsim Weekend', '48 saatlik hardcore milsim.', 'Sakarya Orman', 
       now() + interval '12 days', now() + interval '14 days', creator3_id, 80, now() - interval '15 days', 'upcoming')
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF creator4_id IS NOT NULL THEN
    INSERT INTO events (title, description, location, start_time, end_time, creator_id, capacity, created_at, status) VALUES
      ('Haftalık Maç', 'Her hafta friendly match.', 'Bursa', 
       now() + interval '2 days', now() + interval '2 days' + interval '5 hours', creator4_id, 40, now() - interval '3 days', 'upcoming')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Etkinlik katılımları
  IF creator1_id IS NOT NULL AND creator2_id IS NOT NULL THEN
    INSERT INTO event_participants (event_id, user_id) 
    SELECT e.id, creator2_id FROM events e WHERE e.title = 'Ankara Büyük Savaş' LIMIT 1
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF creator2_id IS NOT NULL AND creator3_id IS NOT NULL THEN
    INSERT INTO event_participants (event_id, user_id) 
    SELECT e.id, creator3_id FROM events e WHERE e.title = 'CQB Antrenman' LIMIT 1
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Demo Reklamlar
INSERT INTO advertisements (title, image_url, link_url, type, position, priority, status)
SELECT 
  'Yeni Sezon Ekipmanları',
  'https://images.pexels.com/photos/1405870/pexels-photo-1405870.jpeg',
  'https://example.com/equipment',
  'banner',
  'home_top',
  10,
  'active'
WHERE NOT EXISTS (SELECT 1 FROM advertisements WHERE title = 'Yeni Sezon Ekipmanları');

INSERT INTO advertisements (title, image_url, link_url, type, position, priority, status)
SELECT 
  'Hafta Sonu Özel İndirimi',
  'https://images.pexels.com/photos/6069028/pexels-photo-6069028.jpeg',
  'https://example.com/sale',
  'banner',
  'marketplace',
  8,
  'active'
WHERE NOT EXISTS (SELECT 1 FROM advertisements WHERE title = 'Hafta Sonu Özel İndirimi');

-- Demo Mesajlar
DO $$
DECLARE
  user1_id uuid;
  user2_id uuid;
BEGIN
  SELECT id INTO user1_id FROM profiles ORDER BY created_at LIMIT 1;
  SELECT id INTO user2_id FROM profiles WHERE id != COALESCE(user1_id, '00000000-0000-0000-0000-000000000000') ORDER BY created_at LIMIT 1 OFFSET 1;
  
  IF user1_id IS NOT NULL AND user2_id IS NOT NULL THEN
    INSERT INTO direct_messages (sender_id, recipient_id, content, created_at) VALUES
      (user1_id, user2_id, 'Selam! Cumartesi günü etkinliğe gelecek misin?', now() - interval '2 hours'),
      (user2_id, user1_id, 'Evet gelirim! Saat kaçta başlıyor?', now() - interval '1 hour 50 minutes'),
      (user1_id, user2_id, 'Saat 10:00 da başlıyor. Ekipmanlarını hazırla', now() - interval '1 hour 45 minutes'),
      (user2_id, user1_id, 'Tamam, hazırım! Beraber gidelim mi?', now() - interval '1 hour 30 minutes'),
      (user1_id, user2_id, 'Olur! Saat 8:30 da buluşalım.', now() - interval '1 hour')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

