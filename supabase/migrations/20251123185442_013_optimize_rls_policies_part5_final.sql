/*
  # RLS Policy Optimizasyonu - Part 5 (Final)
  Notifications, Notification Settings, Marketplace Items, Marketplace Favorites, 
  Marketplace Messages, Advertisements, Ad Clicks
*/

-- NOTIFICATIONS (duplicate'leri temizle ve yeniden oluştur)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users read notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "System creates notifications" ON notifications;
DROP POLICY IF EXISTS "Users delete notifications" ON notifications;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- NOTIFICATION_SETTINGS
DROP POLICY IF EXISTS "Users can view own settings" ON notification_settings;
CREATE POLICY "Users can view own settings"
  ON notification_settings FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON notification_settings;
CREATE POLICY "Users can update own settings"
  ON notification_settings FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own settings" ON notification_settings;
CREATE POLICY "Users can create own settings"
  ON notification_settings FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- MARKETPLACE_ITEMS
DROP POLICY IF EXISTS "Anyone can view active marketplace items" ON marketplace_items;
CREATE POLICY "Anyone can view active marketplace items"
  ON marketplace_items FOR SELECT
  USING (status = 'active' OR seller_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create their own items" ON marketplace_items;
CREATE POLICY "Users can create their own items"
  ON marketplace_items FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Users can update their own items" ON marketplace_items;
CREATE POLICY "Users can update their own items"
  ON marketplace_items FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = seller_id)
  WITH CHECK ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Users can delete their own items" ON marketplace_items;
CREATE POLICY "Users can delete their own items"
  ON marketplace_items FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = seller_id);

-- MARKETPLACE_FAVORITES
DROP POLICY IF EXISTS "Users can view own favorites" ON marketplace_favorites;
CREATE POLICY "Users can view own favorites"
  ON marketplace_favorites FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can add favorites" ON marketplace_favorites;
CREATE POLICY "Users can add favorites"
  ON marketplace_favorites FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can remove favorites" ON marketplace_favorites;
CREATE POLICY "Users can remove favorites"
  ON marketplace_favorites FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- MARKETPLACE_MESSAGES
DROP POLICY IF EXISTS "Users can view their messages" ON marketplace_messages;
CREATE POLICY "Users can view their messages"
  ON marketplace_messages FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = sender_id OR (select auth.uid()) = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON marketplace_messages;
CREATE POLICY "Users can send messages"
  ON marketplace_messages FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = sender_id);

-- ADVERTISEMENTS (duplicate temizle)
DROP POLICY IF EXISTS "Anyone can view active ads" ON advertisements;
DROP POLICY IF EXISTS "Only admins can manage ads" ON advertisements;

CREATE POLICY "Anyone can view active ads"
  ON advertisements FOR SELECT
  USING (
    status = 'active' AND
    start_date <= now() AND
    (end_date IS NULL OR end_date >= now())
  );

CREATE POLICY "Only admins can manage ads"
  ON advertisements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- AD_CLICKS
DROP POLICY IF EXISTS "Users can track ad clicks" ON ad_clicks;
CREATE POLICY "Users can track ad clicks"
  ON ad_clicks FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view ad clicks" ON ad_clicks;
CREATE POLICY "Admins can view ad clicks"
  ON ad_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'moderator')
    )
  );
