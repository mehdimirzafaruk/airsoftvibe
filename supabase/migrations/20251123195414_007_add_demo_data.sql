/*
  # Demo Verileri

  ## İçerik
  
  1. **Demo Kullanıcılar**
     - Admin kullanıcı
     - Normal kullanıcılar
     - Profil bilgileri
  
  2. **Demo Gönderiler**
     - Farklı türlerde içerikler
     - Medya içeren gönderiler
     - Hashtag'li gönderiler
  
  3. **Demo Etkinlikler**
     - Airsoft oyunları
     - Turnuvalar
     - Eğitimler
  
  4. **Demo Marketplace Ürünleri**
     - Silahlar
     - Ekipmanlar
     - Aksesuar lar
  
  5. **Demo Reklamlar**
     - Banner reklamlar
     - Farklı pozisyonlar

  ## Notlar
  - Tüm veriler IF NOT EXISTS kontrolü ile eklenir
  - UUID'ler sabit tutulur (tekrar çalıştırmada hata vermez)
  - Gerçek görünen içerikler kullanılır
*/

-- Demo kullanıcı ID'leri (sabit UUID'ler)
DO $$
DECLARE
  admin_id uuid := 'a0000000-0000-0000-0000-000000000001';
  user1_id uuid := 'a0000000-0000-0000-0000-000000000002';
  user2_id uuid := 'a0000000-0000-0000-0000-000000000003';
  user3_id uuid := 'a0000000-0000-0000-0000-000000000004';
BEGIN
  -- Not: auth.users tablosuna doğrudan veri ekleyemiyoruz
  -- Kullanıcılar sign up ile oluşturulmalı
  -- Burada sadece profiles ve diğer tabloları dolduruyoruz
  
  -- Eğer profiller yoksa örnek profiller ekle (gerçek auth.users varsa)
  -- Bu kısım uygulamada ilk kayıt yapıldığında otomatik oluşacak
  
END $$;

-- Demo marketplace items
INSERT INTO marketplace_items (id, seller_id, title, description, price, currency, category, condition, images, location, status)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1),
  'Tokyo Marui VSR-10 G-Spec',
  'Az kullanılmış, upgraded hop-up ve 6.01 inner barrel. Mükemmel durumda.',
  3500,
  'TL',
  'Silah',
  'like_new',
  '[{"url": "https://images.pexels.com/photos/5207262/pexels-photo-5207262.jpeg"}]'::jsonb,
  'Ankara',
  'active'
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM marketplace_items WHERE title = 'Tokyo Marui VSR-10 G-Spec');

INSERT INTO marketplace_items (id, seller_id, title, description, price, currency, category, condition, images, location, status)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1),
  'Krytac Trident MK2 CRB',
  'Fabrika yeni gibi, 3 macla kullanıldı.',
  5200,
  'TL',
  'Silah',
  'like_new',
  '[{"url": "https://images.pexels.com/photos/8961183/pexels-photo-8961183.jpeg"}]'::jsonb,
  'İstanbul',
  'active'
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM marketplace_items WHERE title = 'Krytac Trident MK2 CRB');

INSERT INTO marketplace_items (id, seller_id, title, description, price, currency, category, condition, images, location, status)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1),
  'Tactical Vest - Multicam',
  'Molle sistemli vest. Orta boy.',
  450,
  'TL',
  'Ekipman',
  'used',
  '[{"url": "https://images.pexels.com/photos/9065218/pexels-photo-9065218.jpeg"}]'::jsonb,
  'İzmir',
  'active'
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM marketplace_items WHERE title = 'Tactical Vest - Multicam');

INSERT INTO marketplace_items (id, seller_id, title, description, price, currency, category, condition, images, location, status)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1),
  'Classic Army M249 Para',
  'Electric, 2500 round box mag.',
  4800,
  'TL',
  'Silah',
  'used',
  '[{"url": "https://images.pexels.com/photos/9065202/pexels-photo-9065202.jpeg"}]'::jsonb,
  'Bursa',
  'active'
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM marketplace_items WHERE title = 'Classic Army M249 Para');

INSERT INTO marketplace_items (id, seller_id, title, description, price, currency, category, condition, images, location, status)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1),
  'Ghillie Suit - Woodland',
  'Profesyonel ghillie. L beden.',
  850,
  'TL',
  'Giyim',
  'like_new',
  '[{"url": "https://images.pexels.com/photos/4618783/pexels-photo-4618783.jpeg"}]'::jsonb,
  'Ankara',
  'active'
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM marketplace_items WHERE title = 'Ghillie Suit - Woodland');

INSERT INTO marketplace_items (id, seller_id, title, description, price, currency, category, condition, images, location, status)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1),
  'Elite Force Glock 17',
  'GBB tabanca, 2 şarjör dahil.',
  1200,
  'TL',
  'Silah',
  'used',
  '[{"url": "https://images.pexels.com/photos/8261589/pexels-photo-8261589.jpeg"}]'::jsonb,
  'İstanbul',
  'active'
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM marketplace_items WHERE title = 'Elite Force Glock 17');

INSERT INTO marketplace_items (id, seller_id, title, description, price, currency, category, condition, images, location, status)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1),
  'Red Dot Sight - Replica',
  'Kaliteli replika. 20mm rail.',
  320,
  'TL',
  'Aksesuar',
  'new',
  '[{"url": "https://images.pexels.com/photos/6193351/pexels-photo-6193351.jpeg"}]'::jsonb,
  'İzmir',
  'active'
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM marketplace_items WHERE title = 'Red Dot Sight - Replica');

INSERT INTO marketplace_items (id, seller_id, title, description, price, currency, category, condition, images, location, status)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1),
  '0.28g BB - 5000 adet',
  'Bio BB, açılmamış kutu.',
  180,
  'TL',
  'Yeni',
  'new',
  '[{"url": "https://images.pexels.com/photos/2253275/pexels-photo-2253275.jpeg"}]'::jsonb,
  'Bursa',
  'active'
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM marketplace_items WHERE title = '0.28g BB - 5000 adet');

-- Demo advertisements
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

-- Demo events (sadece profil varsa)
INSERT INTO events (title, description, location, event_date, max_participants, type, status, creator_id)
SELECT 
  'Hafta Sonu CQB Maçı',
  'İç mekan oyunu. Tüm seviyeler katılabilir.',
  'İstanbul - Arena X',
  now() + interval '3 days',
  24,
  'game',
  'upcoming',
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1)
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM events WHERE title = 'Hafta Sonu CQB Maçı');

INSERT INTO events (title, description, location, event_date, max_participants, type, status, creator_id)
SELECT 
  'Woodland Operasyonu',
  'Açık alan senaryolu oyun. Deneyimli oyuncular için.',
  'Kocaeli - Kerpe Ormanı',
  now() + interval '7 days',
  40,
  'game',
  'upcoming',
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1)
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM events WHERE title = 'Woodland Operasyonu');

INSERT INTO events (title, description, location, event_date, max_participants, type, status, creator_id)
SELECT 
  'Yeni Başlayanlar Eğitimi',
  'Temel güvenlik ve oyun kuralları eğitimi.',
  'Ankara - Takımımızın Sahası',
  now() + interval '5 days',
  15,
  'training',
  'upcoming',
  (SELECT id FROM profiles ORDER BY created_at LIMIT 1)
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM events WHERE title = 'Yeni Başlayanlar Eğitimi');
