-- Voice messages.
--
-- A message is either text or voice. Voice rows keep the transcript-free
-- audio in a PRIVATE storage bucket and reference it by path; playback goes
-- through a signed URL issued by the API after membership is verified, the
-- same pattern user_photos already uses.
--
-- content is still NOT NULL upstream, so voice rows store an empty string —
-- the UI renders from `kind`, never from the text.

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS kind              text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS audio_path        text,
  ADD COLUMN IF NOT EXISTS audio_duration_ms integer;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_kind_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_kind_check CHECK (kind IN ('text', 'voice'));

-- A voice message must actually carry audio.
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_voice_has_audio;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_voice_has_audio
  CHECK (kind <> 'voice' OR audio_path IS NOT NULL);

-- Private bucket. No public read: every playback is a short-lived signed URL.
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice_messages', 'voice_messages', false)
ON CONFLICT (id) DO NOTHING;

-- Uploads and reads both run through the API with the service role, which
-- bypasses RLS — so no storage policies are granted to end users at all.
-- That keeps one audit point for "is this person in this match".
