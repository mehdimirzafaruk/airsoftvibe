/*
  # Demo Veriler - Türkçe Airsoft Temalı
*/

-- Demo Posts
DO $$
DECLARE
  user1_id uuid;
  user2_id uuid;
  user3_id uuid;
  post1_id uuid := gen_random_uuid();
  post2_id uuid := gen_random_uuid();
  post3_id uuid := gen_random_uuid();
  post4_id uuid := gen_random_uuid();
  post5_id uuid := gen_random_uuid();
BEGIN
  SELECT id INTO user1_id FROM profiles ORDER BY created_at LIMIT 1;
  SELECT id INTO user2_id FROM profiles WHERE id != user1_id ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO user3_id FROM profiles WHERE id NOT IN (user1_id, user2_id) ORDER BY created_at LIMIT 1;

  IF user1_id IS NOT NULL THEN
    INSERT INTO posts (id, user_id, content, media_urls, hashtags) VALUES
    (post1_id, user1_id, 'Bugün Polatlı sahasında müthiş bir oyun oynadık! Takımımızla harika bir koordinasyon yakaladık. 🎯 #airsoft #polatli #takim', 
     '["https://images.pexels.com/photos/1202723/pexels-photo-1202723.jpeg"]'::jsonb, 
     '["airsoft", "polatli", "takim"]'::jsonb),
    
    (post2_id, user1_id, 'Yeni aldığım M4 replika harika performans gösteriyor! Accuracy çok iyi, menzili de gayet tatmin edici. #m4 #airsoft #ekipman', 
     '["https://images.pexels.com/photos/705794/pexels-photo-705794.jpeg"]'::jsonb,
     '["m4", "airsoft", "ekipman"]'::jsonb);

    IF user2_id IS NOT NULL THEN
      INSERT INTO posts (id, user_id, content, media_urls, hashtags) VALUES
      (post3_id, user2_id, 'Ankara Eryaman sahasında bu hafta sonu büyük bir organizasyon var! Kim gelecek? 🔥 #ankara #etkinlik #airsoft', 
       NULL,
       '["ankara", "etkinlik", "airsoft"]'::jsonb),
      
      (post4_id, user2_id, 'CQB oyunlarında taktik ve iletişim çok önemli. Bugünkü oyundan öğrendiklerim. #cqb #taktik #airsoft',
       NULL,
       '["cqb", "taktik", "airsoft"]'::jsonb);
      
      -- Comments
      INSERT INTO comments (post_id, user_id, content) VALUES
      (post1_id, user2_id, 'Harika görünüyor! Ben de gelmek isterdim.'),
      (post2_id, user2_id, 'Hangi marka bu M4? Fiyatı ne kadardı?');
      
      -- Likes
      INSERT INTO likes (post_id, user_id) VALUES
      (post1_id, user2_id),
      (post2_id, user2_id);
    END IF;

    IF user3_id IS NOT NULL THEN
      INSERT INTO posts (id, user_id, content, media_urls, hashtags) VALUES
      (post5_id, user3_id, 'Yeni başlayanlar için tavsiyeler: İyi bir maske ve gözlük almayı ihmal etmeyin! Güvenlik her şeyden önemli. #beginner #safety',
       NULL,
       '["beginner", "safety"]'::jsonb);
      
      -- Comments
      INSERT INTO comments (post_id, user_id, content) VALUES
      (post1_id, user3_id, 'Polatlı sahası gerçekten süper bir yer!'),
      (post3_id, user1_id, 'Kesinlikle gelirim! Hangi saatte başlıyor?');
      
      -- Likes
      INSERT INTO likes (post_id, user_id) VALUES
      (post1_id, user3_id),
      (post3_id, user1_id),
      (post3_id, user3_id);
    END IF;

  END IF;
END $$;

-- Demo Events
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM profiles WHERE role IN ('admin', 'moderator') LIMIT 1;
  
  IF admin_id IS NULL THEN
    SELECT id INTO admin_id FROM profiles LIMIT 1;
  END IF;

  IF admin_id IS NOT NULL THEN
    INSERT INTO events (title, description, location, event_date, max_participants, creator_id, event_type) VALUES
    ('Ankara CQB Turnuvası', 'Kapalı alan taktik oyunu turnuvası. Profesyonel hakemler eşliğinde 5v5 maçlar yapılacak.', 'Ankara Eryaman Airsoft Sahası', now() + interval '7 days', 30, admin_id, 'tournament'),
    ('Polatlı Açık Saha Savaşı', 'Geniş açık alanda büyük takım savaşı. Kamp alanı ve yemek mevcut.', 'Polatlı Airsoft Complex', now() + interval '14 days', 50, admin_id, 'milsim'),
    ('Başlangıç Seviye Eğitimi', 'Yeni başlayanlar için temel airsoft eğitimi. Ekipman kiralama dahil.', 'İstanbul Tuzla Training Center', now() + interval '21 days', 20, admin_id, 'training'),
    ('Gece Operasyonu', 'NVG destekli gece oyunu. Deneyimli oyuncular için.', 'Bolu Dağ Sahası', now() + interval '30 days', 25, admin_id, 'scenario'),
    ('İzmir Sahil Senaryosu', 'Deniz kıyısında senaryo bazlı oyun. BBQ ve sosyal aktiviteler.', 'İzmir Urla Airsoft Zone', now() + interval '45 days', 40, admin_id, 'casual');
  END IF;
END $$;

-- Demo Marketplace
DO $$
DECLARE
  seller1_id uuid;
  seller2_id uuid;
BEGIN
  SELECT id INTO seller1_id FROM profiles ORDER BY created_at LIMIT 1;
  SELECT id INTO seller2_id FROM profiles WHERE id != seller1_id ORDER BY created_at LIMIT 1 OFFSET 1;
  
  IF seller1_id IS NOT NULL THEN
    INSERT INTO marketplace_items (title, description, price, category, condition, seller_id, images, location) VALUES
    ('M4A1 AEG Tüfek - Sıfır Ayarında', 'Cyma marka M4A1 AEG tüfek. 2 ay önce alındı, sadece 3 oyunda kullanıldı. Orijinal kutusu ve aksesuarları mevcut.', 3500.00, 'rifles', 'like_new', seller1_id, 
     '["https://images.pexels.com/photos/705794/pexels-photo-705794.jpeg"]'::jsonb, 'Ankara'),
    
    ('Tokyo Marui Glock 17 - Orjinal', 'Tokyo Marui Glock 17 GBB tabanca. 1 yıllık, düzenli bakımlı. 2 adet şarjör ve kılıf hediye.', 2200.00, 'pistols', 'used_good', seller1_id,
     '["https://images.pexels.com/photos/1202723/pexels-photo-1202723.jpeg"]'::jsonb, 'İstanbul'),
    
    ('Taktik Yelek - Molle Sistem', 'Condor marka plate carrier. Siyah renk, M-L beden. Az kullanılmış, temiz durumda.', 800.00, 'gear', 'used_good', seller1_id,
     '["https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg"]'::jsonb, 'İzmir'),
    
    ('Red Dot Sight - Aimpoint Replica', 'Kaliteli Aimpoint T1 replica. Parlak ve net nokta, 11 seviye parlaklık ayarı.', 450.00, 'accessories', 'like_new', seller1_id,
     NULL, 'Ankara'),
    
    ('Tam Set Kıyafet - Multicam', 'Multicam desenli tam takım kıyafet. Pantolon + Combat shirt + Şapka. L beden.', 1200.00, 'gear', 'like_new', seller1_id,
     NULL, 'Ankara'),
    
    ('Taktik Eldiven - Mechanix', 'Mechanix marka taktik eldiven. XL beden, siyah renk. 1 sezon kullanıldı.', 250.00, 'gear', 'used_acceptable', seller1_id,
     NULL, 'Ankara'),
    
    ('Taktik Gözlük - ESS Profile', 'Orijinal ESS Profile NVG uyumlu taktik gözlük. Anti-fog lens.', 650.00, 'gear', 'like_new', seller1_id,
     NULL, 'İzmir');

    IF seller2_id IS NOT NULL THEN
      INSERT INTO marketplace_items (title, description, price, category, condition, seller_id, images, location) VALUES
      ('MP5 SD6 - Sessiz Model', 'Cyma MP5 SD6 suppressor ile. CQB için ideal, harika performans.', 2800.00, 'rifles', 'used_good', seller2_id,
       '["https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg"]'::jsonb, 'Bursa'),
      
      ('LiPo Batarya Seti', 'Yeni, hiç kullanılmamış LiPo batarya. Deans konnektör.', 350.00, 'accessories', 'new', seller2_id,
       NULL, 'İstanbul'),
      
      ('AK-47 AEG - Cyma Metal', 'Cyma CM048 AK-47. Full metal gövde, wood furniture. Güçlü ve dayanıklı.', 3200.00, 'rifles', 'used_good', seller2_id,
       '["https://images.pexels.com/photos/705794/pexels-photo-705794.jpeg"]'::jsonb, 'Antalya');
    END IF;
  END IF;
END $$;

-- Demo Messages
DO $$
DECLARE
  user1_id uuid;
  user2_id uuid;
BEGIN
  SELECT id INTO user1_id FROM profiles ORDER BY created_at LIMIT 1;
  SELECT id INTO user2_id FROM profiles WHERE id != user1_id ORDER BY created_at LIMIT 1 OFFSET 1;
  
  IF user1_id IS NOT NULL AND user2_id IS NOT NULL THEN
    INSERT INTO direct_messages (sender_id, recipient_id, content, created_at) VALUES
    (user1_id, user2_id, 'Selam! Cumartesi günü etkinliğe gelecek misin?', now() - interval '2 hours'),
    (user2_id, user1_id, 'Evet gelirim! Saat kaçta başlıyor?', now() - interval '1 hour 50 minutes'),
    (user1_id, user2_id, 'Saat 10:00 da başlıyor. Ekipmanlarını hazırla', now() - interval '1 hour 45 minutes'),
    (user2_id, user1_id, 'Tamam, hazırım! Beraber gidelim mi?', now() - interval '1 hour 30 minutes'),
    (user1_id, user2_id, 'Olur! Saat 8:30 da buluşalım.', now() - interval '1 hour');
  END IF;
END $$;

-- Demo XP
DO $$
DECLARE
  user_rec RECORD;
  xp_value int;
  rank_name text;
BEGIN
  FOR user_rec IN SELECT id FROM profiles LIMIT 5 LOOP
    xp_value := 150 + (random() * 500)::int;
    
    IF xp_value < 100 THEN
      rank_name := 'Çaylak';
    ELSIF xp_value < 500 THEN
      rank_name := 'Nişancı';
    ELSIF xp_value < 1000 THEN
      rank_name := 'Operatör';
    ELSE
      rank_name := 'Kıdemli';
    END IF;
    
    INSERT INTO user_xp (user_id, total_xp, rank)
    VALUES (user_rec.id, xp_value, rank_name)
    ON CONFLICT (user_id) DO UPDATE 
    SET total_xp = user_xp.total_xp + 50;
  END LOOP;
END $$;

-- Demo Follows
DO $$
DECLARE
  user1_id uuid;
  user2_id uuid;
  user3_id uuid;
BEGIN
  SELECT id INTO user1_id FROM profiles ORDER BY created_at LIMIT 1;
  SELECT id INTO user2_id FROM profiles WHERE id != user1_id ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO user3_id FROM profiles WHERE id NOT IN (user1_id, user2_id) ORDER BY created_at LIMIT 1;
  
  IF user1_id IS NOT NULL AND user2_id IS NOT NULL THEN
    INSERT INTO follows (follower_id, following_id) VALUES
    (user1_id, user2_id),
    (user2_id, user1_id)
    ON CONFLICT DO NOTHING;
    
    IF user3_id IS NOT NULL THEN
      INSERT INTO follows (follower_id, following_id) VALUES
      (user1_id, user3_id),
      (user3_id, user1_id),
      (user2_id, user3_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;
