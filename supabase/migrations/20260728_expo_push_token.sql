-- Expo push token for the React Native apps (one token per user; the mobile
-- client refreshes it on launch). Web browsers use push_subscriptions instead.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS expo_push_token text;

-- Reaction + like notification prefs (the mobile Settings screen already writes
-- these; declared here so the web schema is the single source of truth and the
-- server-side pref gate in lib/push.ts can rely on them existing).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notif_message_reactions boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_liked             boolean NOT NULL DEFAULT true;
