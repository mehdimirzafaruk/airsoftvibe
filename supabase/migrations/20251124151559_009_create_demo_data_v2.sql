/*
  # Demo Veriler - V2

  ## Strateji
  Mevcut profilleri kullanarak demo verileri ekler.
  
  ## İçerik
  - Demo Posts
  - Demo Events  
  - Demo Marketplace Items
*/

DO $$
DECLARE
  profile_count int;
  first_profile_id uuid;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  
  IF profile_count > 0 THEN
    SELECT id INTO first_profile_id FROM profiles ORDER BY created_at LIMIT 1;
    
    -- Demo Posts
    INSERT INTO posts (user_id, content, media_urls, media_type, hashtags, location, visibility)
    SELECT 
      first_profile_id,
      'Bugünkü CQB oyunumuzdan kareler! Ekip olarak harika bir gün geçirdik 🎯',
      '["https://images.pexels.com/photos/5207262/pexels-photo-5207262.jpeg"]'::jsonb,
      'image',
      ARRAY['cqb', 'airsoft', 'tactical'],
      'İstanbul - Arena X',
      'public'
    WHERE NOT EXISTS (SELECT 1 FROM posts LIMIT 1);
    
    INSERT INTO posts (user_id, content, media_urls, media_type, hashtags, location, visibility)
    SELECT 
      first_profile_id,
      'Yeni setup''ım nasıl olmuş? 🎯',
      '["https://images.pexels.com/photos/8961183/pexels-photo-8961183.jpeg"]'::jsonb,
      'image',
      ARRAY['sniper', 'vsr10', 'airsoft'],
      'Ankara',
      'public'
    WHERE NOT EXISTS (SELECT 1 FROM posts WHERE content LIKE '%setup%');
    
    INSERT INTO posts (user_id, content, media_urls, media_type, hashtags, location, visibility)
    SELECT 
      first_profile_id,
      'Bu hafta sonu büyük woodland oyunu! Kim gelecek? 🌲',
      '["https://images.pexels.com/photos/9065218/pexels-photo-9065218.jpeg"]'::jsonb,
      'image',
      ARRAY['woodland', 'event', 'weekend'],
      'Kocaeli - Kerpe',
      'public'
    WHERE NOT EXISTS (SELECT 1 FROM posts WHERE content LIKE '%woodland%');
    
    -- Demo Events
    INSERT INTO events (creator_id, title, description, location, start_time, end_time, max_participants, type, status)
    SELECT 
      first_profile_id,
      'Hafta Sonu CQB Turnuvası',
      'Takım bazlı CQB turnuvası. Ödüller var! Tüm seviyeler katılabilir.',
      'İstanbul - Arena X',
      now() + interval '3 days',
      now() + interval '3 days' + interval '6 hours',
      32,
      'tournament',
      'upcoming'
    WHERE NOT EXISTS (SELECT 1 FROM events LIMIT 1);
    
    INSERT INTO events (creator_id, title, description, location, start_time, end_time, max_participants, type, status)
    SELECT 
      first_profile_id,
      'Woodland Milsim Operasyonu',
      'Büyük ölçekli milsim oyunu. 2 takım, 8 saatlik senaryo.',
      'Kocaeli - Kerpe Ormanı',
      now() + interval '7 days',
      now() + interval '7 days' + interval '8 hours',
      60,
      'game',
      'upcoming'
    WHERE NOT EXISTS (SELECT 1 FROM events WHERE title LIKE '%Woodland%');
    
    INSERT INTO events (creator_id, title, description, location, start_time, end_time, max_participants, type, status)
    SELECT 
      first_profile_id,
      'Yeni Başlayanlar İçin CQB Eğitimi',
      'Temel kurallar, güvenlik ve taktikler. Ekipman desteği var.',
      'Ankara - Takımımızın Sahası',
      now() + interval '5 days',
      now() + interval '5 days' + interval '4 hours',
      20,
      'training',
      'upcoming'
    WHERE NOT EXISTS (SELECT 1 FROM events WHERE title LIKE '%Eğitim%');
    
    -- Demo Marketplace Items (clear first)
    DELETE FROM marketplace_items;
    
    INSERT INTO marketplace_items (seller_id, title, description, price, currency, category, condition, images, location, status)
    VALUES
      (
        first_profile_id,
        'Tokyo Marui VSR-10 G-Spec',
        'Az kullanılmış, upgraded hop-up ve 6.01 inner barrel. Mükemmel durumda.',
        3500,
        'TL',
        'Silah',
        'like_new',
        '["https://images.pexels.com/photos/5207262/pexels-photo-5207262.jpeg"]'::jsonb,
        'Ankara',
        'active'
      ),
      (
        first_profile_id,
        'Krytac Trident MK2 CRB',
        'Fabrika yeni gibi, sadece 3 oyunda kullanıldı.',
        5200,
        'TL',
        'Silah',
        'like_new',
        '["https://images.pexels.com/photos/8961183/pexels-photo-8961183.jpeg"]'::jsonb,
        'İstanbul',
        'active'
      ),
      (
        first_profile_id,
        'Tactical Vest - Multicam',
        'Molle sistemli plate carrier. Orta boy.',
        450,
        'TL',
        'Ekipman',
        'used',
        '["https://images.pexels.com/photos/9065218/pexels-photo-9065218.jpeg"]'::jsonb,
        'İzmir',
        'active'
      ),
      (
        first_profile_id,
        'Classic Army M249 Para',
        'Electric, 2500 round box mag dahil.',
        4800,
        'TL',
        'Silah',
        'used',
        '["https://images.pexels.com/photos/9065202/pexels-photo-9065202.jpeg"]'::jsonb,
        'Bursa',
        'active'
      ),
      (
        first_profile_id,
        'Ghillie Suit - Woodland',
        'Profesyonel ghillie takımı. L beden.',
        850,
        'TL',
        'Giyim',
        'like_new',
        '["https://images.pexels.com/photos/4618783/pexels-photo-4618783.jpeg"]'::jsonb,
        'Ankara',
        'active'
      ),
      (
        first_profile_id,
        'Elite Force Glock 17',
        'GBB tabanca, 2 şarjör dahil.',
        1200,
        'TL',
        'Silah',
        'used',
        '["https://images.pexels.com/photos/8261589/pexels-photo-8261589.jpeg"]'::jsonb,
        'İstanbul',
        'active'
      ),
      (
        first_profile_id,
        'Red Dot Sight - Replica',
        'Kaliteli replika red dot. 20mm rail.',
        320,
        'TL',
        'Aksesuar',
        'new',
        '["https://images.pexels.com/photos/6193351/pexels-photo-6193351.jpeg"]'::jsonb,
        'İzmir',
        'active'
      ),
      (
        first_profile_id,
        '0.28g BB - 5000 adet',
        'Bio BB, açılmamış kutu.',
        180,
        'TL',
        'Malzeme',
        'new',
        '["https://images.pexels.com/photos/2253275/pexels-photo-2253275.jpeg"]'::jsonb,
        'Bursa',
        'active'
      );
  END IF;
END $$;
