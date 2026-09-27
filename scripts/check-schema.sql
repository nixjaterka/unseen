-- Which expected columns are actually there?
--
-- `expires_at` was missing because 20260531_match_expiry.sql never ran, and
-- nothing noticed for months. This lists the columns the code writes, so any
-- other migration that was skipped shows up as a missing row.

SELECT expected.tbl, expected.col,
       CASE WHEN c.column_name IS NULL THEN '❌ MISSING' ELSE '✅' END AS status
FROM (VALUES
  ('matches','expires_at'), ('matches','unmatched_at'), ('matches','unmatched_by'),
  ('matches','chat_unlock_at'), ('matches','match_label'),
  ('messages','kind'), ('messages','audio_path'), ('messages','audio_duration_ms'),
  ('messages','reply_to_id'), ('messages','read_at'),
  ('match_preferences','hidden_at'), ('match_preferences','last_read_at'),
  ('match_preferences','last_delivered_at'), ('match_preferences','emoji'),
  ('reports','message_id'), ('reports','escalated_at'), ('reports','escalated_by'),
  ('reports','resolved_at'), ('reports','resolved_by'),
  ('profiles','deleted_at'), ('profiles','purge_scheduled_at'),
  ('profiles','personality_scores'), ('profiles','priority_sliders'),
  ('profiles','date_of_birth'), ('profiles','premium_until'),
  ('profiles','notif_liked'), ('profiles','notif_new_match'),
  ('profiles','notif_messages'), ('profiles','notif_message_reactions'),
  ('profiles','expo_push_token'),
  ('date_plans','safety_enabled'), ('date_plans','status'), ('date_plans','friend_notified_at')
) AS expected(tbl, col)
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public' AND c.table_name = expected.tbl AND c.column_name = expected.col
ORDER BY status DESC, expected.tbl, expected.col;

-- And the tables themselves:
SELECT t.name,
       CASE WHEN c.table_name IS NULL THEN '❌ MISSING' ELSE '✅' END AS status
FROM (VALUES
  ('matches'),('messages'),('message_reactions'),('match_preferences'),
  ('match_unlock_notifications'),('reports'),('blocked_users'),('swipes'),
  ('profiles'),('photos'),('push_subscriptions'),('date_plans'),('date_checkins')
) AS t(name)
LEFT JOIN information_schema.tables c
  ON c.table_schema = 'public' AND c.table_name = t.name
ORDER BY status DESC, t.name;

-- Storage buckets (voice_messages must exist and be private):
SELECT id, public FROM storage.buckets ORDER BY id;
