/*
  # RLS Policy Optimizasyonu - Part 2
  Likes, Post Saves, Post Reports, User Data Exports
*/

-- LIKES
DROP POLICY IF EXISTS "Users create likes" ON likes;
CREATE POLICY "Users create likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users delete own likes" ON likes;
CREATE POLICY "Users delete own likes"
  ON likes FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- POST_SAVES
DROP POLICY IF EXISTS "Users view own saves" ON post_saves;
CREATE POLICY "Users view own saves"
  ON post_saves FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users save posts" ON post_saves;
CREATE POLICY "Users save posts"
  ON post_saves FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users unsave posts" ON post_saves;
CREATE POLICY "Users unsave posts"
  ON post_saves FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- POST_REPORTS
DROP POLICY IF EXISTS "Admins view reports" ON post_reports;
CREATE POLICY "Admins view reports"
  ON post_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Users view own reports" ON post_reports;
CREATE POLICY "Users view own reports"
  ON post_reports FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = reported_by);

DROP POLICY IF EXISTS "Users report posts" ON post_reports;
CREATE POLICY "Users report posts"
  ON post_reports FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = reported_by);

-- USER_DATA_EXPORTS
DROP POLICY IF EXISTS "Users can view their own data exports" ON user_data_exports;
CREATE POLICY "Users can view their own data exports"
  ON user_data_exports FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can request data export" ON user_data_exports;
CREATE POLICY "Users can request data export"
  ON user_data_exports FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
