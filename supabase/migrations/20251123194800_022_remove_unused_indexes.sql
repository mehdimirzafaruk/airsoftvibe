/*
  # Remove Unused Indexes - Security Optimization
  
  This migration removes indexes that are not being used by queries.
  Unused indexes consume storage and slow down write operations.
  
  ## Changes
  - Drop all unused indexes identified by Supabase analysis
  - Keeps only indexes that are actively used by queries
  - Improves write performance and reduces storage
  
  ## Performance Impact
  - Reduces index maintenance overhead
  - Speeds up INSERT, UPDATE, DELETE operations
  - Reduces storage usage
*/

-- Drop unused indexes on profiles
DROP INDEX IF EXISTS idx_profiles_status;

-- Drop unused indexes on user_privacy_settings
DROP INDEX IF EXISTS idx_user_privacy_settings_user_id;

-- Drop unused indexes on blocked_users
DROP INDEX IF EXISTS idx_blocked_users_blocker_id;
DROP INDEX IF EXISTS idx_blocked_users_blocked_id;

-- Drop unused indexes on events
DROP INDEX IF EXISTS idx_events_creator;

-- Drop unused indexes on posts
DROP INDEX IF EXISTS idx_posts_user_id;
DROP INDEX IF EXISTS idx_posts_created_at;
DROP INDEX IF EXISTS idx_posts_hashtags;

-- Drop unused indexes on comments
DROP INDEX IF EXISTS idx_comments_user_id;
DROP INDEX IF EXISTS idx_comments_parent_comment_id;

-- Drop unused indexes on likes
DROP INDEX IF EXISTS idx_likes_user_id;

-- Drop unused indexes on post_saves
DROP INDEX IF EXISTS idx_post_saves_user_id;

-- Drop unused indexes on post_reports
DROP INDEX IF EXISTS idx_post_reports_post_id;
DROP INDEX IF EXISTS idx_post_reports_reported_by;

-- Drop unused indexes on event_participants
DROP INDEX IF EXISTS idx_event_participants_user;

-- Drop unused indexes on event_group_chats
DROP INDEX IF EXISTS idx_event_group_chats_event;
DROP INDEX IF EXISTS idx_event_group_chats_group_chat_id;

-- Drop unused indexes on group_members
DROP INDEX IF EXISTS idx_group_members_group;
DROP INDEX IF EXISTS idx_group_members_user;

-- Drop unused indexes on direct_messages
DROP INDEX IF EXISTS idx_direct_messages_sender;
DROP INDEX IF EXISTS idx_direct_messages_recipient;
DROP INDEX IF EXISTS idx_direct_messages_created;

-- Drop unused indexes on group_chats
DROP INDEX IF EXISTS idx_group_chats_creator;

-- Drop unused indexes on group_messages
DROP INDEX IF EXISTS idx_group_messages_group;
DROP INDEX IF EXISTS idx_group_messages_user;
DROP INDEX IF EXISTS idx_group_messages_created;

-- Drop unused indexes on ad_clicks
DROP INDEX IF EXISTS idx_ad_clicks_ad_id;
DROP INDEX IF EXISTS idx_ad_clicks_user_id;

-- Drop unused indexes on user_data_exports
DROP INDEX IF EXISTS idx_user_data_exports_user_id;

-- Drop unused indexes on user_xp
DROP INDEX IF EXISTS idx_user_xp_user;
DROP INDEX IF EXISTS idx_user_xp_rank;
DROP INDEX IF EXISTS idx_user_xp_total;

-- Drop unused indexes on xp_transactions
DROP INDEX IF EXISTS idx_xp_transactions_user;
DROP INDEX IF EXISTS idx_xp_transactions_created;

-- Drop unused indexes on admin_actions
DROP INDEX IF EXISTS idx_admin_actions_admin;
DROP INDEX IF EXISTS idx_admin_actions_created;

-- Drop unused indexes on notifications
DROP INDEX IF EXISTS idx_notifications_user;
DROP INDEX IF EXISTS idx_notifications_created;
DROP INDEX IF EXISTS idx_notifications_is_read;

-- Drop unused indexes on marketplace_items
DROP INDEX IF EXISTS idx_marketplace_items_seller;

-- Drop unused indexes on marketplace_favorites
DROP INDEX IF EXISTS idx_marketplace_favorites_user;
DROP INDEX IF EXISTS idx_marketplace_favorites_item_id;

-- Drop unused indexes on marketplace_messages
DROP INDEX IF EXISTS idx_marketplace_messages_item;
DROP INDEX IF EXISTS idx_marketplace_messages_sender_id;
DROP INDEX IF EXISTS idx_marketplace_messages_receiver_id;

-- Drop unused indexes on advertisements
DROP INDEX IF EXISTS idx_advertisements_position;
DROP INDEX IF EXISTS idx_advertisements_status;
