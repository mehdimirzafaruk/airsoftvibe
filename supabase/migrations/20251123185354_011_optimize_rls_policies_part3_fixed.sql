/*
  # RLS Policy Optimizasyonu - Part 3
  Direct Messages, Group Chats, Group Members, Group Messages
*/

-- DIRECT_MESSAGES
DROP POLICY IF EXISTS "Users view own DMs" ON direct_messages;
CREATE POLICY "Users view own DMs"
  ON direct_messages FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IN (sender_id, recipient_id));

DROP POLICY IF EXISTS "Users send DMs" ON direct_messages;
CREATE POLICY "Users send DMs"
  ON direct_messages FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = sender_id);

DROP POLICY IF EXISTS "Users can soft delete DMs" ON direct_messages;
CREATE POLICY "Users can soft delete DMs"
  ON direct_messages FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IN (sender_id, recipient_id))
  WITH CHECK ((select auth.uid()) IN (sender_id, recipient_id));

-- GROUP_CHATS
DROP POLICY IF EXISTS "Users view groups they joined" ON group_chats;
CREATE POLICY "Users view groups they joined"
  ON group_chats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_chats.id
      AND group_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users create groups" ON group_chats;
CREATE POLICY "Users create groups"
  ON group_chats FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = creator_id);

DROP POLICY IF EXISTS "Admins update groups" ON group_chats;
CREATE POLICY "Admins update groups"
  ON group_chats FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_chats.id
      AND group_members.user_id = (select auth.uid())
      AND group_members.role IN ('admin', 'moderator')
    )
  );

-- GROUP_MEMBERS
DROP POLICY IF EXISTS "Users view group members" ON group_members;
CREATE POLICY "Users view group members"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins manage members" ON group_members;
CREATE POLICY "Admins manage members"
  ON group_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = (select auth.uid())
      AND gm.role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Users leave groups" ON group_members;
CREATE POLICY "Users leave groups"
  ON group_members FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- GROUP_MESSAGES
DROP POLICY IF EXISTS "Users view group messages" ON group_messages;
CREATE POLICY "Users view group messages"
  ON group_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_messages.group_id
      AND group_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Members send messages" ON group_messages;
CREATE POLICY "Members send messages"
  ON group_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id AND
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_messages.group_id
      AND group_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users update own messages" ON group_messages;
CREATE POLICY "Users update own messages"
  ON group_messages FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users delete own messages" ON group_messages;
CREATE POLICY "Users delete own messages"
  ON group_messages FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
