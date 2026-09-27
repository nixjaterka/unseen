-- ═══════════════════════════════════════════════════════════════════════════
--  Test conversations between Nikol's two accounts.
--
--  Run in the Supabase SQL editor. Safe to run more than once: it deletes its
--  own previous output first and rebuilds it, so state never accumulates.
--
--  It only ever touches labels starting with 'Seed'. Your existing TestChat01
--  and everything else is left completely alone — that is the whole reason
--  for the separate prefix.
--
--  Creates five conversations, one per thing worth testing:
--    SeedVoice01   — 4 messages each  → voice UNLOCKED, mic is there
--    SeedLocked02  — 1 message each   → voice LOCKED, mic is hidden
--    SeedFilter03  — 3 each           → unlocked, for contact-filter attempts
--    SeedEnded04   — unmatched        → read-only, in Past conversations
--    SeedExpired05 — no messages, old → Expired badge, read-only
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  a uuid;   -- nikol.jaterkova@doosan.com      (iOS)
  b uuid;   -- nikol@randenibezfiltru.cz       (Android / web)
  m bigint;
BEGIN
  SELECT id INTO a FROM auth.users WHERE lower(email) = 'nikol.jaterkova@doosan.com';
  SELECT id INTO b FROM auth.users WHERE lower(email) = 'nikol@randenibezfiltru.cz';

  IF a IS NULL OR b IS NULL THEN
    RAISE EXCEPTION 'One of the accounts was not found (a=%, b=%). Check the addresses.', a, b;
  END IF;

  -- ── Clean up anything a previous run left behind ────────────────────────
  DELETE FROM messages           WHERE match_id IN (SELECT id FROM matches WHERE match_label LIKE 'Seed%');
  DELETE FROM message_reactions  WHERE match_id IN (SELECT id FROM matches WHERE match_label LIKE 'Seed%');
  DELETE FROM match_preferences  WHERE match_id IN (SELECT id FROM matches WHERE match_label LIKE 'Seed%');
  DELETE FROM matches            WHERE match_label LIKE 'Seed%';

  -- ── Mark the two accounts as having swiped each other ───────────────────
  -- These matches are written straight into the table, bypassing the swipe
  -- flow, so without this the two profiles keep surfacing in each other's
  -- deck and can form real matches on top of the seeded ones.
  INSERT INTO swipes (swiper_id, target_id, direction) VALUES (a, b, 'like')
    ON CONFLICT DO NOTHING;
  INSERT INTO swipes (swiper_id, target_id, direction) VALUES (b, a, 'like')
    ON CONFLICT DO NOTHING;

  -- ── 1. Voice unlocked: 4 messages each ──────────────────────────────────
  INSERT INTO matches (user_a, user_b, match_label, chat_unlock_at, expires_at)
  VALUES (a, b, 'SeedVoice01', now() - interval '2 days', now() + interval '5 days')
  RETURNING id INTO m;

  INSERT INTO messages (match_id, sender_id, content, created_at) VALUES
    (m, a, 'Ahoj! Tak jak se máš?',                         now() - interval '90 minutes'),
    (m, b, 'Ahoj, dobře :) A ty?',                          now() - interval '85 minutes'),
    (m, a, 'Taky dobrý. Co jsi dneska dělala?',              now() - interval '80 minutes'),
    (m, b, 'Byla jsem na dlouhé procházce, bylo hezky',      now() - interval '75 minutes'),
    (m, a, 'To zní fajn. Chodíš ven často?',                 now() - interval '70 minutes'),
    (m, b, 'Skoro každý den, jinak se z toho zblázním',      now() - interval '65 minutes'),
    (m, a, 'Chápu. Kam nejradši?',                           now() - interval '60 minutes'),
    (m, b, 'Někam, kde nejsou lidi',                         now() - interval '55 minutes');

  -- ── 2. Voice still locked: 1 message each ───────────────────────────────
  INSERT INTO matches (user_a, user_b, match_label, chat_unlock_at, expires_at)
  VALUES (a, b, 'SeedLocked02', now() - interval '1 day', now() + interval '6 days')
  RETURNING id INTO m;

  INSERT INTO messages (match_id, sender_id, content, created_at) VALUES
    (m, a, 'Ahoj!',            now() - interval '30 minutes'),
    (m, b, 'Ahoj, jak je?',    now() - interval '25 minutes');

  -- ── 3. Unlocked, for contact-filter attempts ────────────────────────────
  INSERT INTO matches (user_a, user_b, match_label, chat_unlock_at, expires_at)
  VALUES (a, b, 'SeedFilter03', now() - interval '3 days', now() + interval '4 days')
  RETURNING id INTO m;

  INSERT INTO messages (match_id, sender_id, content, created_at) VALUES
    (m, a, 'Ahoj, díky za match',        now() - interval '50 minutes'),
    (m, b, 'Taky ahoj!',                 now() - interval '48 minutes'),
    (m, a, 'Máš ráda kafe nebo čaj?',    now() - interval '46 minutes'),
    (m, b, 'Rozhodně kafe',              now() - interval '44 minutes'),
    (m, a, 'Dobrá odpověď',              now() - interval '42 minutes'),
    (m, b, 'Jinak by to nešlo :)',       now() - interval '40 minutes');

  -- ── 4. Ended conversation ───────────────────────────────────────────────
  INSERT INTO matches (user_a, user_b, match_label, chat_unlock_at, expires_at, unmatched_at, unmatched_by)
  VALUES (a, b, 'SeedEnded04', now() - interval '10 days', now() - interval '3 days',
          now() - interval '2 days', b)
  RETURNING id INTO m;

  INSERT INTO messages (match_id, sender_id, content, created_at) VALUES
    (m, a, 'Ahoj, jak se vede?',              now() - interval '9 days'),
    (m, b, 'Ahoj! Docela dobře, díky',        now() - interval '9 days'),
    (m, a, 'Nechceš zajít někdy na kafe?',    now() - interval '8 days');

  -- ── 5. Expired: chat opened over 7 days ago, nobody ever wrote ──────────
  INSERT INTO matches (user_a, user_b, match_label, chat_unlock_at, expires_at)
  VALUES (a, b, 'SeedExpired05', now() - interval '20 days', now() - interval '13 days');

  RAISE NOTICE 'Done. Five seed conversations created between % and %.', a, b;
END $$;

-- What you should now see:
SELECT m.id,
       m.match_label,
       count(msg.id)                                   AS messages,
       count(msg.id) FILTER (WHERE msg.sender_id = m.user_a) AS from_a,
       count(msg.id) FILTER (WHERE msg.sender_id = m.user_b) AS from_b,
       m.unmatched_at IS NOT NULL                      AS ended,
       m.chat_unlock_at
FROM matches m
LEFT JOIN messages msg ON msg.match_id = m.id
WHERE m.match_label LIKE 'Seed%'
GROUP BY m.id, m.match_label, m.unmatched_at, m.chat_unlock_at
ORDER BY m.match_label;
