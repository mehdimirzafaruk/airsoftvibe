-- Demo verilerini kontrol et

-- 1. Kullanıcı profilleri
SELECT COUNT(*) as profile_count FROM profiles;
SELECT username, full_name, role FROM profiles LIMIT 5;

-- 2. Gönderiler
SELECT COUNT(*) as post_count FROM posts;
SELECT content, created_at FROM posts ORDER BY created_at DESC LIMIT 5;

-- 3. Marketplace ürünleri
SELECT COUNT(*) as marketplace_count FROM marketplace_items;
SELECT title, price, category FROM marketplace_items LIMIT 5;

-- 4. Etkinlikler
SELECT COUNT(*) as event_count FROM events;
SELECT title, location, start_time FROM events LIMIT 5;

-- 5. XP verileri
SELECT COUNT(*) as xp_count FROM user_xp;
SELECT p.username, x.total_xp, x.rank 
FROM user_xp x 
JOIN profiles p ON x.user_id = p.id 
LIMIT 5;

