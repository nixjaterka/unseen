# Unseen — Session Handoff

Read this first to pick up where the last session left off. Then read **ABOUT.md** (the concept in Nikol's voice) and **LAUNCH.md** (the live launch checklist).

---

## What this is

A web dating app being vibe-coded by Nikol. Photo-only swipe, ~24-hour delayed chat unlock, no identity reveal phase, intentional friction. Web only for now; App Store is a separate multi-month future project (React Native rewrite or wrapper). UI in English + Czech. Domain `unseenapp.cz` purchased but not yet wired to hosting.

## Stack

- Next.js 15 (App Router), client-side rendered pages
- Supabase: Postgres, Auth, Storage bucket `user_photos`, Realtime for chat
- TypeScript strict, Tailwind for styling
- `lib/supabase.ts` (browser client), `lib/supabaseServer.ts` (server, session-aware), `lib/supabaseAdmin.ts` (service role, bypasses RLS)
- i18n: `lib/i18n/` with `useT()` hook and a flat-dotted-key dictionary in `dictionary.ts` (en + cs)

## Architecture decisions worth knowing

- **`/api/swipe/next` is the single source of truth for matching.** The dashboard reads stats from `?mode=dashboard`. Don't duplicate the algorithm elsewhere.
- **Soft-delete with retention.** Profiles have `deleted_at` and `purge_scheduled_at` columns. Account deletion sets these immediately + wipes photos/swipes/etc., but keeps matches/messages for safety (1 year, or forever if reports exist against the user). Background sweep job to finish the purge is task #26 in LAUNCH.md, not yet built.
- **Photo moderation pipeline.** `lib/moderation.ts` → Sightengine. `PhotoUploader` calls `/api/photos/moderate` after upload, before inserting the photo row. Fails closed (rejects upload) when Sightengine errors and is configured; fails open (logs warning) when API keys aren't set.
- **Reports backend.** `/api/reports/submit` inserts the row server-side AND fires a notification email via Resend HTTP API (`lib/email.ts`) to `unseen-safety@randenibezfiltru.cz`.
- **Email aliases on `randenibezfiltru.cz`.** Nikol's existing dating-coaching domain. All `mailto:` links and the support address constant reference these. Decision pending on whether to migrate to `unseenapp.cz` eventually.
- **Redirect style is consistent.** `router.replace` for auth/state-driven redirects, `router.push` for user-initiated navigation. No `window.location.href` anywhere.
- **Every authenticated page gates on `onboarded_at`.** Dashboard and `/login` also check `deleted_at` and refuse access if set.
- **`.in(uuid, [...])` queries are chunked** in `/api/swipe/next` and `/api/swipe/debug` because the URL blows past Node fetch limits at 500+ users.

## Schema migrations (Nikol runs manually in Supabase SQL editor)

Files live in `scripts/migrations/`. Confirmation of which have been run:

| Migration | Status |
| --- | --- |
| `deleted_at timestamptz` on profiles | Run |
| `personality_scores integer[]` on profiles (Phase A) | **Likely not yet — confirm with Nikol** |
| `priority_sliders integer[]` on profiles (Phase C) | **Likely not yet — confirm with Nikol** |
| `purge_scheduled_at timestamptz` on profiles + index | **Not yet** |
| `safety_check_ins` table (paused feature) | Not yet, feature deferred until phone app exists |

## Personality / matching engine state

**Built (code complete):**
- **Phase A** — 25 sliders foundation. Brand-styled UI on `/profile` with all 50 trait labels + 5 group titles translated to Czech. Schema: `personality_scores integer[]` length 25.
- **Phase B** — silent compatibility scoring. `compatibility()` helper in `lib/personality.ts`. Surfaced in `/api/swipe/debug`.
- **Phase C** — free tier matching. 1 priority slider (`priority_sliders int[]` column). Queue mix: 30% biased toward priority compat + 70% random + Beeline (people who liked you appear earlier within both buckets). Profile redesign: personality sliders and priority picker merged with inline yellow stars.

**Not built (deferred until Premium tier):**
- **Phase D** — Stripe subscription infrastructure
- **Phase E** — Premium gates: 3 priority sliders, 1 dealbreaker + range, 40/25/35 queue mix
- **Phase F** — Boost: premium user right-swipes someone who passed their dealbreaker → they jump to the front of that person's queue (self-limiting via interest signal)
- **Phase G** — Chat markers: ⭐ for dealbreaker pass, "compatible" tag for priority match, both visible only inside chat

**Locked design decisions (do not relitigate):**
- Compat scoring is **Design B**: ONLY priority sliders count. Other sliders are ignored for the score. Falls back to all 25 only if viewer has no priorities set (Phase C state for users who haven't picked yet).
- Boost reciprocity (Phase F) fires only when premium user right-swipes someone who passed their dealbreaker.
- Chat markers (Phase G) visible only in-chat, never at swipe.
- The compat-score-in-swipe display currently shipping is **test-only**, gated to two profile IDs in `COMPAT_DISPLAY_USER_IDS` (top of `app/swipe/page.tsx`). Decision pending what to do for launch (remove / keep for everyone / premium-only).

## Brand voice (the spine — don't drift)

- Minimal text. Confident. Neutral. No fake friendliness. No emojis in copy unless explicitly asked.
- See ABOUT.md for the full articulation in Nikol's voice.

## Non-negotiables (never add these)

- Bios, prompts, "fun facts" on profile — weakens anti-bias-by-subtraction (the spine of the product)
- Identity-reveal-after-N-messages phase — the brand's hardest line
- Skip-the-wait paid tier — guts the friction-as-feature mechanic
- Block feature — deliberately skipped (revisit only under real abuse load)

## Critical path to web soft launch

See LAUNCH.md "Up next" section. As of last session:

- [x] #1 Forgot-password flow (`/forgot-password`, `/reset-password`)
- [x] #2 Email aliases (code-side done; Nikol's Resend SMTP setup pending)
- [x] #3 Photo moderation (code done; Sightengine signup + env vars pending)
- [x] #4 Reports backend (code done; Resend API setup pending)
- [x] #5 Account deletion with safety retention (code done; sweep job is task #26)
- [ ] #6 Hosting + domain — `unseenapp.cz` purchased, Vercel setup + DNS pending
- [ ] #7 Cookie consent banner
- [ ] #8 Wipe 500 test dummies before first real user
- [ ] #9 Fill legal placeholders in Terms + Privacy
- [ ] #10 Mobile responsive sanity pass
- [ ] #26 Background sweep job for retention-expired profiles

## Nikol's pending action items (operator work, not coding)

These were listed in chat but may not all be done. The last she confirmed was creating the email aliases.

1. **Resend** — sign up at resend.com, verify the domain `randenibezfiltru.cz` (DNS records they provide → add at her registrar)
2. **Sightengine** — sign up at sightengine.com, get API user + secret
3. **Run three migrations** in Supabase SQL editor:
   - `personality_scores integer[]` + length-25 constraint
   - `priority_sliders integer[]` + length-1-to-3 constraint
   - `purge_scheduled_at timestamptz` + partial index
4. **Supabase dashboard config**:
   - Auth → SMTP Settings: Resend host/port/credentials, sender `unseen-noreply@randenibezfiltru.cz`
   - Auth → URL Configuration → Redirect URLs: add `http://localhost:3000/reset-password` and the prod equivalent once hosted
5. **`.env.local`** add:
   ```
   SIGHTENGINE_API_USER=
   SIGHTENGINE_API_SECRET=
   RESEND_API_KEY=
   RESEND_FROM_EMAIL=unseen-noreply@randenibezfiltru.cz
   SAFETY_EMAIL=unseen-safety@randenibezfiltru.cz
   ```
6. **Run** `npx tsx scripts/backfillPersonality.ts` after personality migration is applied — populates personality scores for the 500 seeded dummies so the queue mix has real data
7. **Decisions to make** (no rush):
   - Keep emails on `randenibezfiltru.cz` or migrate to `unseenapp.cz`
   - What to do with compat-score-in-swipe display (test-only / everyone / premium-only)
   - DPO appointment: appoint someone or remove the DPO section from Privacy Policy

## Nikol's two test profile IDs

For the compat-score gate, debug, any test-only logic:

- `770288df-fedc-4ae8-b5f1-e5e4e0157e5e`
- `f301370f-8cff-4846-9473-4771d4923c46`

The seed script creates ~15 matches and ~20 one-sided likes targeting each of these.

## Key files at a glance

**Lib:**
- `lib/i18n/I18nProvider.tsx`, `lib/i18n/dictionary.ts`, `lib/i18n/index.ts`
- `lib/personality.ts` — sliders, `compatibility()` (Design B)
- `lib/email.ts` — Resend HTTP API
- `lib/moderation.ts` — Sightengine
- `lib/supabase.ts`, `lib/supabaseServer.ts`, `lib/supabaseAdmin.ts`

**API routes:**
- `/api/swipe/next` (single source of truth for matching)
- `/api/swipe/action` (submits a like/pass, creates match on mutual like)
- `/api/swipe/debug` (diagnostic — funnel counts, compat distribution)
- `/api/account/export` (GDPR data export)
- `/api/account/delete` (soft delete with retention)
- `/api/photos/moderate`
- `/api/reports/submit`

**Pages:**
- `app/page.tsx` (landing, auth-aware)
- `app/login/page.tsx`, `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`
- `app/onboarding/page.tsx`, `app/onboarding/intro/page.tsx`, `app/onboarding/PhotoUploader.tsx`
- `app/app/page.tsx` (dashboard)
- `app/swipe/page.tsx`, `app/matches/page.tsx`, `app/chat/[matchId]/page.tsx`
- `app/profile/page.tsx`, `app/settings/page.tsx`
- `app/terms/page.tsx`, `app/privacy/page.tsx` (use `app/components/LegalDoc.tsx`)
- `app/components/BottomNav.tsx`

**Scripts:**
- `scripts/seedUsers.ts` (500-dummy seed: profiles, photos, matches, seeded chat history)
- `scripts/backfillPersonality.ts` (populates `personality_scores` for existing dummies)
- `scripts/migrations/*.sql`

## Known gaps / honest caveats

- Multi-device session revocation on account delete is a small leak (refresh tokens roll, ~1hr exposure window)
- Privacy Policy references a DPO that doesn't exist yet — appoint someone or remove the section before launch
- Legal docs have bracketed placeholders: `[INSERT DATE]`, `[INSERT GOVERNING JURISDICTION]`, `[INSERT ADDRESS]`, `[X]` days retention, `[arbitration body]`, regional crisis-line resources
- The `bio` column on profiles and `profile_prompts` table still exist in DB but aren't written/read by code anymore. Legacy users with bios filled in still have the data — included in GDPR export but not displayed
- Pre-existing lint warnings: a handful of `any` types in three files (`matches/page.tsx`, `chat/[matchId]/page.tsx`, `onboarding/page.tsx`), `<img>` warnings across the project (deliberate — no `next/image`), one function-hoisting issue in chat. None blocks builds.

## How to resume a conversation

1. Have Nikol confirm where she is in the action-items list above (most likely: she's about to do the Resend/Sightengine setup and migrations).
2. Pick up from the next unchecked LAUNCH.md item, currently #6 (hosting + domain).
3. Match the brand voice in ABOUT.md. Match the conversation style: clarify decisions before coding, don't pile on options, write tight.
4. Don't relitigate the locked design decisions. Don't add anything from "non-negotiables." Don't drift toward Tinder.
