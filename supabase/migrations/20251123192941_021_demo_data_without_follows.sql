/*
  # Demo Data - Final (Follows tablosu olmadan)
*/

DO $$
DECLARE
  demo_usernames text[] := ARRAY['ahmet_sniper', 'ayse_tactical', 'mehmet_assault', 'zeynep_support', 'admin'];
  demo_user_ids uuid[];
BEGIN
  SELECT ARRAY_AGG(id) INTO demo_user_ids FROM profiles WHERE username = ANY(demo_usernames);
  IF demo_user_ids IS NOT NULL THEN
    DELETE FROM event_participants WHERE user_id = ANY(demo_user_ids);
    DELETE FROM likes WHERE user_id = ANY(demo_user_ids);
    DELETE FROM posts WHERE user_id = ANY(demo_user_ids);
    DELETE FROM marketplace_items WHERE seller_id = ANY(demo_user_ids);
    DELETE FROM events WHERE creator_id = ANY(demo_user_ids);
    DELETE FROM user_xp WHERE user_id = ANY(demo_user_ids);
    DELETE FROM profiles WHERE id = ANY(demo_user_ids);
    DELETE FROM auth.users WHERE id = ANY(demo_user_ids);
  END IF;
END $$;

DO $$
DECLARE
  user1_id uuid := gen_random_uuid();
  user2_id uuid := gen_random_uuid();
  user3_id uuid := gen_random_uuid();
  user4_id uuid := gen_random_uuid();
  user5_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud) VALUES
    (user1_id, '00000000-0000-0000-0000-000000000000', 'ahmet@airsoft.com', crypt('demo123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
    (user2_id, '00000000-0000-0000-0000-000000000000', 'ayse@airsoft.com', crypt('demo123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
    (user3_id, '00000000-0000-0000-0000-000000000000', 'mehmet@airsoft.com', crypt('demo123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
    (user4_id, '00000000-0000-0000-0000-000000000000', 'zeynep@airsoft.com', crypt('demo123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
    (user5_id, '00000000-0000-0000-0000-000000000000', 'admin@airsoft.com', crypt('admin123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated');

  INSERT INTO profiles (id, username, full_name, bio, team_info, favorite_equipment, role, avatar_url) VALUES
    (user1_id, 'ahmet_sniper', 'Ahmet Yılmaz', 'Airsoft tutkunu, sniper uzmanı. 5 yıldır aktif oyuncuyum.', 'Ankara Wolves', 'VSR-10 Sniper', 'user', 'https://images.pexels.com/photos/1416530/pexels-photo-1416530.jpeg?auto=compress&w=150'),
    (user2_id, 'ayse_tactical', 'Ayşe Demir', 'Taktik sevdalısı, CQB uzmanı. Kadın oyuncuları teşvik ediyorum!', 'İstanbul Ravens', 'MP5 SMG', 'user', 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&w=150'),
    (user3_id, 'mehmet_assault', 'Mehmet Kaya', 'Assault rifle seviyorum, açık alan oyunları favorim.', 'İzmir Spartans', 'M4A1 Carbine', 'user', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&w=150'),
    (user4_id, 'zeynep_support', 'Zeynep Arslan', 'Support gunner, ağır silah tutkunu. Takım oyununa inanıyorum.', 'Bursa Vipers', 'M249 SAW', 'user', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&w=150'),
    (user5_id, 'admin', 'Admin', 'Airsoft Vibe platformunun yöneticisi', NULL, NULL, 'admin', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&w=150');

  INSERT INTO user_xp (user_id, total_xp, rank) VALUES
    (user1_id, 1250, 'Kıdemli'),
    (user2_id, 850, 'Operatör'),
    (user3_id, 450, 'Nişancı'),
    (user4_id, 2800, 'Usta'),
    (user5_id, 5500, 'Kırmızı Gölge');

  INSERT INTO posts (user_id, content, media_urls, location, created_at) VALUES
    (user1_id, 'Bugün harika bir sahada oynadık! VSR-10 ile 50 metreden isabetler aldım. #sniper #airsoft', '["https://images.pexels.com/photos/1474996/pexels-photo-1474996.jpeg?auto=compress&w=600"]'::jsonb, 'Ankara - Gölbaşı Sahası', now() - interval '2 hours'),
    (user2_id, 'Yeni ekipmanlarım geldi! Tactical vest ve kask seti çok kaliteli. #gear #tactical', '["https://images.pexels.com/photos/163407/bomb-attack-soldiers-warriors-163407.jpeg?auto=compress&w=600"]'::jsonb, 'İstanbul', now() - interval '5 hours'),
    (user3_id, 'Hafta sonu maçına hazırlanıyorum. M4 temizliği yapıldı, bataryalar şarjda! Kim geliyor?', '[]'::jsonb, NULL, now() - interval '8 hours'),
    (user4_id, 'M249 SAW ile suppressing fire verirken çekilen fotoğraf. Takım oyununun gücü!', '["https://images.pexels.com/photos/50577/hedgehog-animal-baby-cute-50577.jpeg?auto=compress&w=600"]'::jsonb, 'Bursa', now() - interval '12 hours'),
    (user1_id, 'Ghillie suit yeni aldım, kamuflaj testi başarılı! Kimse göremedi.', '["https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg?auto=compress&w=600"]'::jsonb, NULL, now() - interval '1 day'),
    (user2_id, 'CQB taktikleri eğitimi veriyorum. İlgilenen varsa mesaj atabilir!', '[]'::jsonb, 'İstanbul', now() - interval '1 day'),
    (user3_id, 'Yeni hop-up ayarı yaptım, menzil 10 metre arttı! BB kalitesi önemli.', '[]'::jsonb, NULL, now() - interval '2 days'),
    (user4_id, 'Takım olarak ilk maçımızı kazandık! Bursa Vipers en iyisi!', '["https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&w=600"]'::jsonb, 'Bursa', now() - interval '2 days'),
    (user1_id, 'Scope ayarları: Önce 25m mesafede sıfırlayın, sonra 50m test.', '[]'::jsonb, NULL, now() - interval '3 days'),
    (user2_id, 'Kadın oyuncu sayımız artıyor! Birlikte daha güçlüyüz.', '["https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg?auto=compress&w=600"]'::jsonb, NULL, now() - interval '3 days'),
    (user3_id, 'M4 ima yeni red dot sight taktım. Harika çalışıyor!', '["https://images.pexels.com/photos/209948/pexels-photo-209948.jpeg?auto=compress&w=600"]'::jsonb, NULL, now() - interval '4 days'),
    (user4_id, 'Box mag temizliği çok önemli! Düzenli bakım şart.', '[]'::jsonb, NULL, now() - interval '5 days'),
    (user1_id, 'Gece oyunu için NVG aldım. Gece görüşü deneyimi bambaşka!', '[]'::jsonb, NULL, now() - interval '6 days'),
    (user2_id, 'Speedsoft değil, milsim seviyoruz! Gerçekçi taktikler.', '[]'::jsonb, NULL, now() - interval '7 days'),
    (user3_id, 'Yeni saha keşfi: Sakarya da harika bir orman sahası!', '["https://images.pexels.com/photos/416779/pexels-photo-416779.jpeg?auto=compress&w=600"]'::jsonb, 'Sakarya', now() - interval '8 days');

  INSERT INTO marketplace_items (seller_id, title, description, price, category, condition, images, location) VALUES
    (user1_id, 'Tokyo Marui VSR-10 G-Spec', 'Az kullanılmış. Upgraded hop-up ve 6.01 inner barrel.', 3500.00, 'silah', 'kullanilmis', '["https://images.pexels.com/photos/209935/pexels-photo-209935.jpeg?auto=compress&w=400"]'::jsonb, 'Ankara'),
    (user2_id, 'Krytac Trident MK2 CRB', 'Fabrika yeni gibi, 3 maçta kullanıldı.', 5200.00, 'silah', 'sifir_gibi', '["https://images.pexels.com/photos/209948/pexels-photo-209948.jpeg?auto=compress&w=400"]'::jsonb, 'İstanbul'),
    (user3_id, 'Tactical Vest - Multicam', 'Molle sistemli vest. Orta boy.', 450.00, 'ekipman', 'kullanilmis', '["https://images.pexels.com/photos/163407/bomb-attack-soldiers-warriors-163407.jpeg?auto=compress&w=400"]'::jsonb, 'İzmir'),
    (user4_id, 'Classic Army M249 Para', 'Electric SAW, 2500 round box mag.', 4800.00, 'silah', 'kullanilmis', '["https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&w=400"]'::jsonb, 'Bursa'),
    (user1_id, 'Ghillie Suit - Woodland', 'Profesyonel ghillie. L beden.', 850.00, 'giyim', 'kullanilmis', '["https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg?auto=compress&w=400"]'::jsonb, 'Ankara'),
    (user2_id, 'Elite Force Glock 17', 'GBB tabanca, 2 şarjör dahil.', 1200.00, 'silah', 'kullanilmis', '["https://images.pexels.com/photos/209831/pexels-photo-209831.jpeg?auto=compress&w=400"]'::jsonb, 'İstanbul'),
    (user3_id, 'Red Dot Sight - Replica', 'Kaliteli replika. 20mm rail.', 320.00, 'aksesuar', 'sifir_gibi', '["https://images.pexels.com/photos/163444/dog-cavalier-king-charles-spaniel-funny-pet-163444.jpeg?auto=compress&w=400"]'::jsonb, 'İzmir'),
    (user4_id, '0.28g BB - 5000 adet', 'Bio BB, açılmamış kutu.', 180.00, 'aksesuar', 'yeni', '["https://images.pexels.com/photos/257540/pexels-photo-257540.jpeg?auto=compress&w=400"]'::jsonb, 'Bursa');

  INSERT INTO events (title, description, location, start_time, end_time, creator_id, capacity, created_at) VALUES
    ('Ankara Büyük Savaş', 'Ayın en büyük etkinliği! 100+ oyuncu.', 'Gölbaşı, Ankara', now() + interval '5 days', now() + interval '5 days' + interval '6 hours', user1_id, 120, now() - interval '10 days'),
    ('CQB Antrenman', 'İç mekan CQB eğitimi.', 'İstanbul Kartal', now() + interval '3 days', now() + interval '3 days' + interval '3 hours', user2_id, 30, now() - interval '5 days'),
    ('Milsim Weekend', '48 saatlik hardcore milsim.', 'Sakarya Orman', now() + interval '12 days', now() + interval '14 days', user3_id, 80, now() - interval '15 days'),
    ('Sniper Eğitimi', 'Profesyonel sniper taktikleri.', 'Ankara Gölbaşı', now() + interval '8 days', now() + interval '8 days' + interval '4 hours', user1_id, 20, now() - interval '7 days'),
    ('Haftalık Maç', 'Her hafta friendly match.', 'Bursa', now() + interval '2 days', now() + interval '2 days' + interval '5 hours', user4_id, 40, now() - interval '3 days');

  INSERT INTO event_participants (event_id, user_id) SELECT e.id, user1_id FROM events e WHERE e.title = 'Ankara Büyük Savaş';
  INSERT INTO event_participants (event_id, user_id) SELECT e.id, user2_id FROM events e WHERE e.title = 'Ankara Büyük Savaş';
  INSERT INTO event_participants (event_id, user_id) SELECT e.id, user3_id FROM events e WHERE e.title = 'CQB Antrenman';

  INSERT INTO likes (post_id, user_id) SELECT p.id, user2_id FROM posts p WHERE p.user_id = user1_id LIMIT 3;
  INSERT INTO likes (post_id, user_id) SELECT p.id, user3_id FROM posts p WHERE p.user_id = user2_id LIMIT 2;

END $$;
