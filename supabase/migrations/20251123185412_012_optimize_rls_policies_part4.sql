/*
  # RLS Policy Optimizasyonu - Part 4
  Events, Event Participants, Event Group Chats, User XP, XP Transactions, Admin Actions
*/

-- EVENTS
DROP POLICY IF EXISTS "Admins create events" ON events;
CREATE POLICY "Admins create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Event creators update own events" ON events;
CREATE POLICY "Event creators update own events"
  ON events FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = creator_id)
  WITH CHECK ((select auth.uid()) = creator_id);

DROP POLICY IF EXISTS "Admins delete events" ON events;
CREATE POLICY "Admins delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- EVENT_PARTICIPANTS
DROP POLICY IF EXISTS "Users join events" ON event_participants;
CREATE POLICY "Users join events"
  ON event_participants FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users update own participation" ON event_participants;
CREATE POLICY "Users update own participation"
  ON event_participants FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users cancel participation" ON event_participants;
CREATE POLICY "Users cancel participation"
  ON event_participants FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- EVENT_GROUP_CHATS
DROP POLICY IF EXISTS "Users view event chats" ON event_group_chats;
CREATE POLICY "Users view event chats"
  ON event_group_chats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_participants
      WHERE event_participants.event_id = event_group_chats.event_id
      AND event_participants.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins create event chats" ON event_group_chats;
CREATE POLICY "Admins create event chats"
  ON event_group_chats FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- USER_XP
DROP POLICY IF EXISTS "Users view own XP" ON user_xp;
DROP POLICY IF EXISTS "Public XP view" ON user_xp;
CREATE POLICY "Public XP view"
  ON user_xp FOR SELECT
  TO authenticated
  USING (true);

-- XP_TRANSACTIONS
DROP POLICY IF EXISTS "Users view own transactions" ON xp_transactions;
CREATE POLICY "Users view own transactions"
  ON xp_transactions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ADMIN_ACTIONS
DROP POLICY IF EXISTS "Admins view audit logs" ON admin_actions;
CREATE POLICY "Admins view audit logs"
  ON admin_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'moderator')
    )
  );
