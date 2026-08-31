-- Reports can now point at ONE message, not just the conversation.
--
-- This matters most for voice messages: a moderator needs to know which
-- recording to listen to, and "somewhere in this conversation" is not an
-- answer. message_id stays nullable — reporting a whole conversation from
-- the ⋯ menu is still valid.

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS message_id bigint REFERENCES public.messages (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS reports_message_id_idx ON public.reports (message_id);

-- ON DELETE SET NULL rather than CASCADE on purpose: if the message is ever
-- deleted the report must survive, because the report is the reason we keep
-- the conversation at all.
