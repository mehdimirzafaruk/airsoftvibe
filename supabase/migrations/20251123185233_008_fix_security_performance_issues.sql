/*
  # Güvenlik ve Performans İyileştirmeleri

  ## 1. Eksik Foreign Key İndeksleri
  ## 2. RLS Policy Optimizasyonu  
  ## 3. Function Search Path Güvenliği
*/

-- ========================================
-- 1. EKSİK FOREIGN KEY İNDEKSLERİ
-- ========================================

CREATE INDEX IF NOT EXISTS idx_ad_clicks_ad_id ON ad_clicks(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_user_id ON ad_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_event_group_chats_group_chat_id ON event_group_chats(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_item_id ON marketplace_favorites(item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_receiver_id ON marketplace_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_sender_id ON marketplace_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_reported_by ON post_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_user_data_exports_user_id ON user_data_exports(user_id);

-- ========================================
-- 2. FUNCTION SEARCH PATH GÜVENLİĞİ
-- ========================================

CREATE OR REPLACE FUNCTION increment_ad_view_count(ad_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE advertisements
  SET view_count = view_count + 1
  WHERE id = ad_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*)::int INTO v_count
  FROM notifications
  WHERE user_id = p_user_id AND is_read = false;
  
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION increment_item_view_count(item_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE marketplace_items
  SET view_count = view_count + 1
  WHERE id = item_uuid;
END;
$$;
