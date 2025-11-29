/*
  ============================================
  KAPSAMLI DEMO VERİ SCRIPT'İ
  ============================================
  Tüm tablolar için demo verileri ekler.
  Mevcut kullanıcıları kullanır.
  ============================================
*/

DO $$
DECLARE
  profile_ids uuid[];
  profile_count int;
  post_ids uuid[];
  comment_ids uuid[];
  event_ids uuid[];
  marketplace_item_ids uuid[];
  group_chat_ids uuid[];
  ad_ids uuid[];
  temp_user_id uuid;
  temp_post_id uuid;
  temp_comment_id uuid;
  temp_event_id uuid;
  temp_item_id uuid;
  temp_group_id uuid;
  temp_ad_id uuid;
BEGIN
  -- Mevcut profilleri al
  SELECT ARRAY_AGG(id), COUNT(*) INTO profile_ids, profile_count 
  FROM profiles;
  
  -- Eğer hiç profil yoksa uyarı ver ve çık
  IF profile_count = 0 THEN
    RAISE NOTICE 'UYARI: Hiç kullanıcı profili bulunamadı!';
    RAISE NOTICE 'Lütfen önce en az bir kullanıcı kaydı oluşturun.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Demo veriler ekleniyor... % kullanıcı profili bulundu.', profile_count;
  
  -- ============================================
  -- 1. PROFİLLERİ GÜNCELLE (XP ve Rank)
  -- ============================================
  UPDATE user_xp 
  SET 
    total_xp = CASE 
      WHEN random() < 0.3 THEN floor(random() * 500)::int  -- Çaylak
      WHEN random() < 0.6 THEN 100 + floor(random() * 400)::int  -- Nişancı
      WHEN random() < 0.8 THEN 500 + floor(random() * 500)::int  -- Operatör
      WHEN random() < 0.9 THEN 1000 + floor(random() * 1500)::int  -- Kıdemli
      WHEN random() < 0.95 THEN 2500 + floor(random() * 2500)::int  -- Usta
      ELSE 5000 + floor(random() * 2000)::int  -- Kırmızı Gölge
    END,
    level = floor(random() * 50)::int + 1,
    rank = CASE 
      WHEN random() < 0.3 THEN 'Çaylak'
      WHEN random() < 0.6 THEN 'Nişancı'
      WHEN random() < 0.8 THEN 'Operatör'
      WHEN random() < 0.9 THEN 'Kıdemli'
      WHEN random() < 0.95 THEN 'Usta'
      ELSE 'Kırmızı Gölge'
    END
  WHERE user_id = ANY(profile_ids);
  
  -- Profilleri güncelle (bio, full_name vb.)
  UPDATE profiles 
  SET 
    full_name = CASE 
      WHEN random() < 0.3 THEN 'Airsoft Sever'
      WHEN random() < 0.6 THEN 'Taktik Uzmanı'
      WHEN random() < 0.8 THEN 'CQB Oyuncusu'
      ELSE 'Milsim Askeri'
    END || ' ' || floor(random() * 1000)::text,
    bio = CASE floor(random() * 5)::int
      WHEN 0 THEN 'Airsoft tutkunu. CQB ve woodland oyunları severim. 🎯'
      WHEN 1 THEN 'Taktik oyunlar ve ekipman toplama hobisi var. ⚡'
      WHEN 2 THEN 'Yeni başladım ama çok sevdim! 🌱'
      WHEN 3 THEN 'Uzun yıllardır oynuyorum. Turnuvalara katılıyorum. 🏆'
      ELSE 'Takım oyunlarını ve strateji oyunlarını seviyorum. 🔥'
    END
  WHERE id = ANY(profile_ids);
  
  -- ============================================
  -- 2. FOLLOWS (Takip İlişkileri)
  -- ============================================
  FOR i IN 1..LEAST(profile_count * 3, 50) LOOP
    BEGIN
      INSERT INTO follows (follower_id, following_id)
      SELECT 
        profile_ids[1 + floor(random() * profile_count)::int],
        profile_ids[1 + floor(random() * profile_count)::int]
      WHERE NOT EXISTS (
        SELECT 1 FROM follows 
        WHERE follower_id = profile_ids[1 + floor(random() * profile_count)::int]
        AND following_id = profile_ids[1 + floor(random() * profile_count)::int]
      )
      AND profile_ids[1 + floor(random() * profile_count)::int] != 
          profile_ids[1 + floor(random() * profile_count)::int]
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
  
  -- ============================================
  -- 3. POSTS (Gönderiler)
  -- ============================================
  INSERT INTO posts (user_id, content, media_urls, media_type, hashtags, location, visibility, created_at)
  VALUES
    (profile_ids[1], 'Bugünkü CQB oyunumuzdan kareler! Ekip olarak harika bir gün geçirdik 🎯', 
     '["https://images.pexels.com/photos/5207262/pexels-photo-5207262.jpeg"]'::jsonb, 
     'image', ARRAY['cqb', 'airsoft', 'tactical'], 'İstanbul - Arena X', 'public',
     now() - interval '2 days'),
    (profile_ids[1], 'Yeni setup''ım nasıl olmuş? 🎯', 
     '["https://images.pexels.com/photos/8961183/pexels-photo-8961183.jpeg"]'::jsonb, 
     'image', ARRAY['sniper', 'vsr10', 'airsoft'], 'Ankara', 'public',
     now() - interval '1 day'),
    (profile_ids[1], 'Bu hafta sonu büyük woodland oyunu! Kim gelecek? 🌲', 
     '["https://images.pexels.com/photos/9065218/pexels-photo-9065218.jpeg"]'::jsonb, 
     'image', ARRAY['woodland', 'event', 'weekend'], 'Kocaeli - Kerpe', 'public',
     now() - interval '3 hours'),
    (profile_ids[LEAST(2, profile_count)], 'Turnuvadan önce son antrenman! 💪', 
     '[]'::jsonb, 'none', ARRAY['tournament', 'training'], 'İzmir', 'public',
     now() - interval '5 hours'),
    (profile_ids[LEAST(2, profile_count)], 'Ekipman koleksiyonum büyüyor 🔫', 
     '["https://images.pexels.com/photos/9065202/pexels-photo-9065202.jpeg"]'::jsonb, 
     'image', ARRAY['gear', 'collection'], 'Bursa', 'public',
     now() - interval '1 day'),
    (profile_ids[LEAST(3, profile_count)], 'Milsim operasyonu muhteşemdi! 🎖️', 
     '["https://images.pexels.com/photos/4618783/pexels-photo-4618783.jpeg"]'::jsonb, 
     'image', ARRAY['milsim', 'operation'], 'Antalya', 'public',
     now() - interval '4 days'),
    (profile_ids[LEAST(1, profile_count)], 'Yeni başlayanlar için öneriler: Hangi silahı almalı?', 
     '[]'::jsonb, 'none', ARRAY['beginner', 'advice'], NULL, 'public',
     now() - interval '6 hours'),
    (profile_ids[LEAST(2, profile_count)], 'Takım arkadaşlarımızla takım fotoğrafı 📸', 
     '["https://images.pexels.com/photos/8261589/pexels-photo-8261589.jpeg"]'::jsonb, 
     'image', ARRAY['team', 'photo'], 'İstanbul', 'public',
     now() - interval '12 hours')
  ON CONFLICT DO NOTHING;
  
  -- Post ID'lerini al
  SELECT ARRAY_AGG(id) INTO post_ids FROM posts WHERE user_id = ANY(profile_ids) LIMIT 20;
  
  -- ============================================
  -- 4. COMMENTS (Yorumlar)
  -- ============================================
  IF array_length(post_ids, 1) > 0 THEN
    FOR i IN 1..LEAST(array_length(post_ids, 1) * 3, 30) LOOP
      BEGIN
        INSERT INTO comments (post_id, user_id, content, created_at)
        SELECT 
          post_ids[1 + floor(random() * array_length(post_ids, 1))::int],
          profile_ids[1 + floor(random() * profile_count)::int],
          CASE floor(random() * 5)::int
            WHEN 0 THEN 'Harika görünüyor! 👏'
            WHEN 1 THEN 'Çok güzel bir setup'
            WHEN 2 THEN 'Bende de var, çok memnunum'
            WHEN 3 THEN 'Ne zaman oynayacağız?'
            ELSE 'Harika! Ben de katılmak istiyorum 🎯'
          END,
          now() - interval '1 day' * random()
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
    
    -- Comment ID'lerini al
    SELECT ARRAY_AGG(id) INTO comment_ids FROM comments WHERE post_id = ANY(post_ids) LIMIT 30;
  END IF;
  
  -- ============================================
  -- 5. LIKES (Beğeniler)
  -- ============================================
  IF array_length(post_ids, 1) > 0 THEN
    FOR i IN 1..LEAST(array_length(post_ids, 1) * 4, 40) LOOP
      BEGIN
        INSERT INTO likes (post_id, user_id, created_at)
        SELECT 
          post_ids[1 + floor(random() * array_length(post_ids, 1))::int],
          profile_ids[1 + floor(random() * profile_count)::int],
          now() - interval '1 day' * random()
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END IF;
  
  -- ============================================
  -- 6. COMMENT LIKES (Yorum Beğenileri)
  -- ============================================
  IF array_length(comment_ids, 1) > 0 THEN
    FOR i IN 1..LEAST(array_length(comment_ids, 1) * 2, 20) LOOP
      BEGIN
        INSERT INTO comment_likes (comment_id, user_id, created_at)
        SELECT 
          comment_ids[1 + floor(random() * array_length(comment_ids, 1))::int],
          profile_ids[1 + floor(random() * profile_count)::int],
          now() - interval '1 day' * random()
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END IF;
  
  -- ============================================
  -- 7. POST SAVES (Kaydedilenler)
  -- ============================================
  IF array_length(post_ids, 1) > 0 THEN
    FOR i IN 1..LEAST(array_length(post_ids, 1) * 2, 15) LOOP
      BEGIN
        INSERT INTO post_saves (post_id, user_id, created_at)
        SELECT 
          post_ids[1 + floor(random() * array_length(post_ids, 1))::int],
          profile_ids[1 + floor(random() * profile_count)::int],
          now() - interval '2 days' * random()
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END IF;
  
  -- ============================================
  -- 8. EVENTS (Etkinlikler)
  -- ============================================
  INSERT INTO events (creator_id, title, description, location, start_time, end_time, max_participants, type, status, created_at)
  VALUES
    (profile_ids[1], 'Hafta Sonu CQB Turnuvası', 
     'Takım bazlı CQB turnuvası. Ödüller var! Tüm seviyeler katılabilir.',
     'İstanbul - Arena X', now() + interval '3 days', now() + interval '3 days' + interval '6 hours',
     32, 'tournament', 'upcoming', now() - interval '5 days'),
    (profile_ids[LEAST(2, profile_count)], 'Woodland Milsim Operasyonu', 
     'Büyük ölçekli milsim oyunu. 2 takım, 8 saatlik senaryo.',
     'Kocaeli - Kerpe Ormanı', now() + interval '7 days', now() + interval '7 days' + interval '8 hours',
     60, 'game', 'upcoming', now() - interval '3 days'),
    (profile_ids[LEAST(1, profile_count)], 'Yeni Başlayanlar İçin CQB Eğitimi', 
     'Temel kurallar, güvenlik ve taktikler. Ekipman desteği var.',
     'Ankara - Takımımızın Sahası', now() + interval '5 days', now() + interval '5 days' + interval '4 hours',
     20, 'training', 'upcoming', now() - interval '2 days'),
    (profile_ids[LEAST(2, profile_count)], 'Gece Oyunu - Özel Etkinlik', 
     'Gece oyunu deneyimi. Özel ekipmanlar gerekli.',
     'İzmir - Şehir Dışı Saha', now() + interval '10 days', now() + interval '10 days' + interval '6 hours',
     24, 'game', 'upcoming', now() - interval '1 day'),
    (profile_ids[LEAST(1, profile_count)], 'Airsoft Tanışma Etkinliği', 
     'Yeni oyuncular için tanışma ve bilgilendirme.',
     'Bursa - Merkez Lokasyon', now() + interval '4 days', now() + interval '4 days' + interval '3 hours',
     30, 'meetup', 'upcoming', now() - interval '6 hours')
  ON CONFLICT DO NOTHING;
  
  -- Event ID'lerini al
  SELECT ARRAY_AGG(id) INTO event_ids FROM events WHERE creator_id = ANY(profile_ids) LIMIT 10;
  
  -- ============================================
  -- 9. EVENT PARTICIPANTS (Etkinlik Katılımcıları)
  -- ============================================
  IF array_length(event_ids, 1) > 0 THEN
    FOR i IN 1..LEAST(array_length(event_ids, 1) * 5, 25) LOOP
      BEGIN
        INSERT INTO event_participants (event_id, user_id, status, joined_at)
        SELECT 
          event_ids[1 + floor(random() * array_length(event_ids, 1))::int],
          profile_ids[1 + floor(random() * profile_count)::int],
          CASE floor(random() * 3)::int
            WHEN 0 THEN 'going'
            WHEN 1 THEN 'pending'
            ELSE 'confirmed'
          END,
          now() - interval '2 days' * random()
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END IF;
  
  -- ============================================
  -- 10. MARKETPLACE ITEMS (Pazar Yeri Ürünleri)
  -- ============================================
  INSERT INTO marketplace_items (seller_id, title, description, price, currency, category, condition, images, location, status, created_at)
  VALUES
    (profile_ids[1], 'Tokyo Marui VSR-10 G-Spec', 
     'Az kullanılmış, upgraded hop-up ve 6.01 inner barrel. Mükemmel durumda.',
     3500, 'TL', 'Silah', 'like_new',
     '["https://images.pexels.com/photos/5207262/pexels-photo-5207262.jpeg"]'::jsonb,
     'Ankara', 'active', now() - interval '5 days'),
    (profile_ids[LEAST(2, profile_count)], 'Krytac Trident MK2 CRB', 
     'Fabrika yeni gibi, sadece 3 oyunda kullanıldı.',
     5200, 'TL', 'Silah', 'like_new',
     '["https://images.pexels.com/photos/8961183/pexels-photo-8961183.jpeg"]'::jsonb,
     'İstanbul', 'active', now() - interval '3 days'),
    (profile_ids[LEAST(1, profile_count)], 'Tactical Vest - Multicam', 
     'Molle sistemli plate carrier. Orta boy.',
     450, 'TL', 'Ekipman', 'used',
     '["https://images.pexels.com/photos/9065218/pexels-photo-9065218.jpeg"]'::jsonb,
     'İzmir', 'active', now() - interval '7 days'),
    (profile_ids[LEAST(2, profile_count)], 'Classic Army M249 Para', 
     'Electric, 2500 round box mag dahil.',
     4800, 'TL', 'Silah', 'used',
     '["https://images.pexels.com/photos/9065202/pexels-photo-9065202.jpeg"]'::jsonb,
     'Bursa', 'active', now() - interval '2 days'),
    (profile_ids[LEAST(1, profile_count)], 'Ghillie Suit - Woodland', 
     'Profesyonel ghillie takımı. L beden.',
     850, 'TL', 'Giyim', 'like_new',
     '["https://images.pexels.com/photos/4618783/pexels-photo-4618783.jpeg"]'::jsonb,
     'Ankara', 'active', now() - interval '4 days'),
    (profile_ids[LEAST(2, profile_count)], 'Elite Force Glock 17', 
     'GBB tabanca, 2 şarjör dahil.',
     1200, 'TL', 'Silah', 'used',
     '["https://images.pexels.com/photos/8261589/pexels-photo-8261589.jpeg"]'::jsonb,
     'İstanbul', 'active', now() - interval '1 day'),
    (profile_ids[LEAST(1, profile_count)], 'Red Dot Sight - Replica', 
     'Kaliteli replika red dot. 20mm rail.',
     320, 'TL', 'Aksesuar', 'new',
     '["https://images.pexels.com/photos/6193351/pexels-photo-6193351.jpeg"]'::jsonb,
     'İzmir', 'active', now() - interval '6 days'),
    (profile_ids[LEAST(2, profile_count)], '0.28g BB - 5000 adet', 
     'Bio BB, açılmamış kutu.',
     180, 'TL', 'Malzeme', 'new',
     '["https://images.pexels.com/photos/2253275/pexels-photo-2253275.jpeg"]'::jsonb,
     'Bursa', 'active', now() - interval '3 days'),
    (profile_ids[LEAST(1, profile_count)], 'Airsoft Maske - Full Face', 
     'Ansi Z87.1 sertifikalı, anti-fog.',
     280, 'TL', 'Koruma', 'new',
     '["https://images.pexels.com/photos/5207262/pexels-photo-5207262.jpeg"]'::jsonb,
     'Ankara', 'active', now() - interval '2 days'),
    (profile_ids[LEAST(2, profile_count)], 'Tactical Boots - Size 42', 
     'Su geçirmez, çok rahat.',
     420, 'TL', 'Giyim', 'like_new',
     '["https://images.pexels.com/photos/8961183/pexels-photo-8961183.jpeg"]'::jsonb,
     'İstanbul', 'active', now() - interval '5 days')
  ON CONFLICT DO NOTHING;
  
  -- Marketplace item ID'lerini al
  SELECT ARRAY_AGG(id) INTO marketplace_item_ids FROM marketplace_items WHERE seller_id = ANY(profile_ids) LIMIT 20;
  
  -- ============================================
  -- 11. MARKETPLACE FAVORITES (Favoriler)
  -- ============================================
  IF array_length(marketplace_item_ids, 1) > 0 THEN
    FOR i IN 1..LEAST(array_length(marketplace_item_ids, 1) * 2, 15) LOOP
      BEGIN
        INSERT INTO marketplace_favorites (item_id, user_id, created_at)
        SELECT 
          marketplace_item_ids[1 + floor(random() * array_length(marketplace_item_ids, 1))::int],
          profile_ids[1 + floor(random() * profile_count)::int],
          now() - interval '3 days' * random()
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END IF;
  
  -- ============================================
  -- 12. MARKETPLACE MESSAGES (Ürün Mesajları)
  -- ============================================
  IF array_length(marketplace_item_ids, 1) > 0 THEN
    FOR i IN 1..LEAST(array_length(marketplace_item_ids, 1) * 2, 10) LOOP
      BEGIN
        temp_item_id := marketplace_item_ids[1 + floor(random() * array_length(marketplace_item_ids, 1))::int];
        SELECT seller_id INTO temp_user_id FROM marketplace_items WHERE id = temp_item_id;
        
        INSERT INTO marketplace_messages (item_id, sender_id, receiver_id, message, created_at)
        SELECT 
          temp_item_id,
          profile_ids[1 + floor(random() * profile_count)::int],
          temp_user_id,
          CASE floor(random() * 4)::int
            WHEN 0 THEN 'Merhaba, bu ürün hala satılık mı?'
            WHEN 1 THEN 'Fiyatta pazarlık olur mu?'
            WHEN 2 THEN 'Nerede görüşebiliriz?'
            ELSE 'Ürünün durumu nasıl?'
          END,
          now() - interval '2 days' * random()
        WHERE profile_ids[1 + floor(random() * profile_count)::int] != temp_user_id
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END IF;
  
  -- ============================================
  -- 13. GROUP CHATS (Grup Sohbetleri)
  -- ============================================
  INSERT INTO group_chats (creator_id, name, description, created_at)
  VALUES
    (profile_ids[1], 'İstanbul Airsoft Takımı', 'İstanbul bölgesi oyuncuları', now() - interval '10 days'),
    (profile_ids[LEAST(2, profile_count)], 'CQB Severler', 'CQB oyunları için grup', now() - interval '7 days'),
    (profile_ids[LEAST(1, profile_count)], 'Woodland Oyuncuları', 'Woodland ve milsim severler', now() - interval '5 days')
  ON CONFLICT DO NOTHING;
  
  -- Group chat ID'lerini al
  SELECT ARRAY_AGG(id) INTO group_chat_ids FROM group_chats WHERE creator_id = ANY(profile_ids) LIMIT 10;
  
  -- ============================================
  -- 14. GROUP MEMBERS (Grup Üyeleri)
  -- ============================================
  IF array_length(group_chat_ids, 1) > 0 THEN
    FOR i IN 1..array_length(group_chat_ids, 1) LOOP
      temp_group_id := group_chat_ids[i];
      
      -- Her gruba creator'ı admin olarak ekle
      INSERT INTO group_members (group_id, user_id, role, joined_at)
      SELECT 
        temp_group_id,
        creator_id,
        'admin',
        created_at
      FROM group_chats WHERE id = temp_group_id
      ON CONFLICT DO NOTHING;
      
      -- Her gruba rastgele 3-5 üye ekle
      FOR j IN 1..LEAST(5, profile_count - 1) LOOP
        BEGIN
          INSERT INTO group_members (group_id, user_id, role, joined_at)
          SELECT 
            temp_group_id,
            profile_ids[1 + floor(random() * profile_count)::int],
            CASE WHEN random() < 0.1 THEN 'moderator' ELSE 'member' END,
            now() - interval '5 days' * random()
          ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END LOOP;
    END LOOP;
  END IF;
  
  -- ============================================
  -- 15. GROUP MESSAGES (Grup Mesajları)
  -- ============================================
  IF array_length(group_chat_ids, 1) > 0 THEN
    FOR i IN 1..LEAST(array_length(group_chat_ids, 1) * 10, 30) LOOP
      BEGIN
        temp_group_id := group_chat_ids[1 + floor(random() * array_length(group_chat_ids, 1))::int];
        
        INSERT INTO group_messages (group_id, user_id, content, created_at)
        SELECT 
          temp_group_id,
          user_id,
          CASE floor(random() * 5)::int
            WHEN 0 THEN 'Merhaba herkese! 👋'
            WHEN 1 THEN 'Bu hafta sonu kim oynayacak?'
            WHEN 2 THEN 'Yeni etkinlik oluşturdum, bakabilir misiniz?'
            WHEN 3 THEN 'Ekipman önerisi isteyen var mı?'
            ELSE 'Harika bir oyun oldu bugün! 🎯'
          END,
          now() - interval '3 days' * random()
        FROM group_members WHERE group_id = temp_group_id
        ORDER BY random() LIMIT 1
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END IF;
  
  -- ============================================
  -- 16. DIRECT MESSAGES (Direkt Mesajlar)
  -- ============================================
  FOR i IN 1..LEAST(profile_count * 2, 20) LOOP
    BEGIN
      INSERT INTO direct_messages (sender_id, recipient_id, content, created_at)
      SELECT 
        profile_ids[1 + floor(random() * profile_count)::int],
        profile_ids[1 + floor(random() * profile_count)::int],
        CASE floor(random() * 4)::int
          WHEN 0 THEN 'Merhaba, nasılsın?'
          WHEN 1 THEN 'Bu hafta sonu oyuna katılır mısın?'
          WHEN 2 THEN 'Ekipman konusunda yardım lazım'
          ELSE 'Teşekkürler!'
        END,
        now() - interval '4 days' * random()
      WHERE profile_ids[1 + floor(random() * profile_count)::int] != 
            profile_ids[1 + floor(random() * profile_count)::int]
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
  
  -- ============================================
  -- 17. NOTIFICATIONS (Bildirimler)
  -- ============================================
  IF array_length(post_ids, 1) > 0 THEN
    FOR i IN 1..LEAST(profile_count * 3, 40) LOOP
      BEGIN
        INSERT INTO notifications (user_id, type, title, message, related_id, related_type, created_at)
        SELECT 
          profile_ids[1 + floor(random() * profile_count)::int],
          CASE floor(random() * 5)::int
            WHEN 0 THEN 'like'
            WHEN 1 THEN 'comment'
            WHEN 2 THEN 'follow'
            WHEN 3 THEN 'event'
            ELSE 'message'
          END,
          CASE floor(random() * 5)::int
            WHEN 0 THEN 'Gönderiniz beğenildi'
            WHEN 1 THEN 'Gönderinize yorum yapıldı'
            WHEN 2 THEN 'Yeni takipçi'
            WHEN 3 THEN 'Etkinlik hatırlatması'
            ELSE 'Yeni mesaj'
          END,
          CASE floor(random() * 5)::int
            WHEN 0 THEN 'Gönderiniz beğenildi'
            WHEN 1 THEN 'Gönderinize yorum yapıldı'
            WHEN 2 THEN 'Sizi takip etmeye başladı'
            WHEN 3 THEN 'Etkinlik başlamak üzere'
            ELSE 'Size mesaj gönderdi'
          END,
          CASE WHEN random() < 0.5 AND array_length(post_ids, 1) > 0 
            THEN post_ids[1 + floor(random() * array_length(post_ids, 1))::int] 
            ELSE NULL 
          END,
          CASE WHEN random() < 0.5 THEN 'post' ELSE NULL END,
          now() - interval '2 days' * random()
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END IF;
  
  -- ============================================
  -- 18. XP TRANSACTIONS (XP İşlemleri)
  -- ============================================
  FOR i IN 1..LEAST(profile_count * 5, 50) LOOP
    BEGIN
      INSERT INTO xp_transactions (user_id, amount, reason, created_at)
      SELECT 
        profile_ids[1 + floor(random() * profile_count)::int],
        CASE floor(random() * 4)::int
          WHEN 0 THEN 10  -- Post oluşturma
          WHEN 1 THEN 5   -- Yorum yapma
          WHEN 2 THEN 2   -- Beğeni
          ELSE 20         -- Etkinlik katılımı
        END,
        CASE floor(random() * 4)::int
          WHEN 0 THEN 'Gönderi oluşturuldu'
          WHEN 1 THEN 'Yorum yapıldı'
          WHEN 2 THEN 'Gönderi beğenildi'
          ELSE 'Etkinliğe katılım'
        END,
        now() - interval '7 days' * random()
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
  
  -- ============================================
  -- 19. POST REPORTS (Şikayetler)
  -- ============================================
  IF array_length(post_ids, 1) > 0 THEN
    FOR i IN 1..LEAST(3, array_length(post_ids, 1)) LOOP
      BEGIN
        INSERT INTO post_reports (post_id, reported_by, reason, status, created_at)
        SELECT 
          post_ids[1 + floor(random() * array_length(post_ids, 1))::int],
          profile_ids[1 + floor(random() * profile_count)::int],
          CASE floor(random() * 3)::int
            WHEN 0 THEN 'Spam içerik'
            WHEN 1 THEN 'Uygunsuz içerik'
            ELSE 'Yanıltıcı bilgi'
          END,
          CASE WHEN random() < 0.5 THEN 'pending' ELSE 'reviewed' END,
          now() - interval '3 days' * random()
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END IF;
  
  -- ============================================
  -- 20. ADVERTISEMENTS (Reklamlar)
  -- ============================================
  INSERT INTO advertisements (title, image_url, link_url, type, position, priority, start_date, end_date, status, created_at)
  VALUES
    ('Airsoft Ekipmanları - %20 İndirim', 
     'https://images.pexels.com/photos/5207262/pexels-photo-5207262.jpeg',
     'https://example.com/shop', 'banner', 'home_top', 10,
     now() - interval '5 days', now() + interval '30 days', 'active', now() - interval '5 days'),
    ('Yeni Saha Açılışı - Ücretsiz Deneme', 
     'https://images.pexels.com/photos/8961183/pexels-photo-8961183.jpeg',
     'https://example.com/arena', 'native', 'feed', 8,
     now() - interval '2 days', now() + interval '15 days', 'active', now() - interval '2 days'),
    ('Turnuva Kayıtları Başladı', 
     'https://images.pexels.com/photos/9065218/pexels-photo-9065218.jpeg',
     'https://example.com/tournament', 'banner', 'home_middle', 9,
     now(), now() + interval '20 days', 'active', now())
  ON CONFLICT DO NOTHING;
  
  -- Ad ID'lerini al
  SELECT ARRAY_AGG(id) INTO ad_ids FROM advertisements LIMIT 10;
  
  -- ============================================
  -- 21. AD CLICKS (Reklam Tıklamaları)
  -- ============================================
  IF array_length(ad_ids, 1) > 0 THEN
    FOR i IN 1..LEAST(profile_count * 2, 20) LOOP
      BEGIN
        INSERT INTO ad_clicks (ad_id, user_id, clicked_at)
        SELECT 
          ad_ids[1 + floor(random() * array_length(ad_ids, 1))::int],
          profile_ids[1 + floor(random() * profile_count)::int],
          now() - interval '3 days' * random()
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END IF;
  
  -- ============================================
  -- 22. EVENT GROUP CHATS (Etkinlik Grup Sohbetleri)
  -- ============================================
  IF array_length(event_ids, 1) > 0 AND array_length(group_chat_ids, 1) > 0 THEN
    FOR i IN 1..LEAST(array_length(event_ids, 1), 3) LOOP
      BEGIN
        INSERT INTO event_group_chats (event_id, group_chat_id, created_at)
        SELECT 
          event_ids[i],
          group_chat_ids[LEAST(i, array_length(group_chat_ids, 1))],
          now() - interval '2 days'
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END IF;
  
  -- ============================================
  -- 23. HASHTAG USAGE (Hashtag Kullanımı - Post trigger'ı otomatik ekliyor)
  -- ============================================
  -- Bu veriler post trigger'ı tarafından otomatik oluşturuluyor
  -- Ekstra hashtag'ler ekleyebiliriz
  
  INSERT INTO hashtag_usage (hashtag, count, last_used_at)
  VALUES
    ('airsoft', 25, now() - interval '1 hour'),
    ('cqb', 18, now() - interval '2 hours'),
    ('woodland', 12, now() - interval '5 hours'),
    ('tactical', 15, now() - interval '3 hours'),
    ('milsim', 10, now() - interval '1 day'),
    ('tournament', 8, now() - interval '2 days'),
    ('beginner', 6, now() - interval '3 days'),
    ('gear', 14, now() - interval '4 hours')
  ON CONFLICT (hashtag) DO UPDATE SET 
    count = hashtag_usage.count + EXCLUDED.count,
    last_used_at = EXCLUDED.last_used_at;
  
  RAISE NOTICE 'Demo veriler başarıyla eklendi!';
  RAISE NOTICE '- Posts: % adet', array_length(post_ids, 1);
  RAISE NOTICE '- Events: % adet', array_length(event_ids, 1);
  RAISE NOTICE '- Marketplace Items: % adet', array_length(marketplace_item_ids, 1);
  RAISE NOTICE '- Group Chats: % adet', array_length(group_chat_ids, 1);
  
END $$;

