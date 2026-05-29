-- Add reply_to_id to messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reply_to_id bigint REFERENCES messages(id) ON DELETE SET NULL;

-- Message reactions (one reaction per user per message)
CREATE TABLE IF NOT EXISTS message_reactions (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message_id  bigint NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  match_id    bigint NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id     uuid   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji       text   NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Both match participants can read reactions
CREATE POLICY "reactions_select" ON message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
        AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
    )
  );

-- Can only insert your own reaction on a match you're in (and it's not unmatched)
CREATE POLICY "reactions_insert" ON message_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
        AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
        AND m.unmatched_at IS NULL
    )
  );

-- Can only update your own reaction
CREATE POLICY "reactions_update" ON message_reactions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Can only delete your own reaction
CREATE POLICY "reactions_delete" ON message_reactions FOR DELETE
  USING (user_id = auth.uid());

-- Index for fast lookup by match (used for realtime filtering)
CREATE INDEX IF NOT EXISTS message_reactions_match_id_idx ON message_reactions(match_id);
CREATE INDEX IF NOT EXISTS message_reactions_message_id_idx ON message_reactions(message_id);
