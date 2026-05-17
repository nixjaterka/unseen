-- Tracks pending chat-unlock email notifications.
-- A cron job hits /api/cron/chat-unlock every 15 minutes to send them.

CREATE TABLE IF NOT EXISTS match_unlock_notifications (
  id          BIGSERIAL PRIMARY KEY,
  match_id    BIGINT NOT NULL,
  user_a      UUID   NOT NULL,
  user_b      UUID   NOT NULL,
  match_label TEXT   NOT NULL,
  unlock_at   TIMESTAMPTZ NOT NULL,
  notified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mun_unlock_at_idx
  ON match_unlock_notifications (unlock_at)
  WHERE notified = FALSE;
