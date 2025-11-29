/*
  # RLS Policy Optimizasyonu - Part 1
  Profiles, User Privacy, Blocked Users, Posts, Comments
*/

-- PROFILES
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Only authenticated users can create profile on signup" ON profiles;
CREATE POLICY "Only authenticated users can create profile on signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- USER_PRIVACY_SETTINGS
DROP POLICY IF EXISTS "Users can view own privacy settings" ON user_privacy_settings;
CREATE POLICY "Users can view own privacy settings"
  ON user_privacy_settings FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own privacy settings" ON user_privacy_settings;
CREATE POLICY "Users can update own privacy settings"
  ON user_privacy_settings FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own privacy settings" ON user_privacy_settings;
CREATE POLICY "Users can insert own privacy settings"
  ON user_privacy_settings FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- BLOCKED_USERS
DROP POLICY IF EXISTS "Users can view their own blocks" ON blocked_users;
CREATE POLICY "Users can view their own blocks"
  ON blocked_users FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "Users can block other users" ON blocked_users;
CREATE POLICY "Users can block other users"
  ON blocked_users FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "Users can unblock users" ON blocked_users;
CREATE POLICY "Users can unblock users"
  ON blocked_users FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = blocker_id);

-- POSTS
DROP POLICY IF EXISTS "Users create own posts" ON posts;
CREATE POLICY "Users create own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users update own posts" ON posts;
CREATE POLICY "Users update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users delete own posts" ON posts;
CREATE POLICY "Users delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins delete any post" ON posts;
CREATE POLICY "Admins delete any post"
  ON posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- COMMENTS
DROP POLICY IF EXISTS "Users create comments" ON comments;
CREATE POLICY "Users create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users update own comments" ON comments;
CREATE POLICY "Users update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users delete own comments" ON comments;
CREATE POLICY "Users delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins delete any comment" ON comments;
CREATE POLICY "Admins delete any comment"
  ON comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'moderator')
    )
  );
