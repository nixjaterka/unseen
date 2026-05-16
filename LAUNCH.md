# Unseen — Launch Checklist

A working doc. Tick items off in your editor as you ship them.
Organized by milestones, each one a real step toward live users.

---

## Up next (the critical path to web soft launch)

Working through these in order. Each is a real launch blocker.

1. **Forgot-password flow** — Supabase has the primitive, UI doesn't exist. Half-day.
2. **Real transactional email + support inboxes** — Inbox aliases on `randenibezfiltru.cz` (your existing domain) for `unseen-support`, `unseen-legal`, `unseen-privacy`, `unseen-safety`, `unseen-dpo`, `unseen-security`, `unseen-noreply`. Code references updated. Still need to: (a) verify domain in Resend (or chosen SMTP provider), (b) plug Resend SMTP credentials into Supabase Auth dashboard so confirmation/reset emails actually arrive.
3. **Photo content moderation on upload** — NSFW screen via Sightengine or AWS Rekognition.
4. **Reports actually go somewhere** — admin queue or email notification when a report fires.
5. **Account deletion with safety retention** — when a user deletes: profile marked deleted, photos wiped from storage, swipes dropped, matches ended (in UI). Messages and match rows kept securely. `purge_scheduled_at` set to now + 1 year if no reports against the user, null (= retain indefinitely) if any reports exist. Background sweep job to finish the deletion at the scheduled time is still TODO (Milestone 2/3).
6. **Hosting + domain** — Vercel + `unseenapp.cz` (domain purchased). Still need: configure Vercel project, point DNS at Vercel, add `https://unseenapp.cz/reset-password` to Supabase Auth redirect URLs. Decision pending on whether to move email addresses from `randenibezfiltru.cz` to `unseenapp.cz` (or keep current setup).
7. **Cookie consent banner** — EU requirement.
8. **Wipe the 500 test dummies** — before any real user signs up.
9. **Fill the legal placeholders** — effective dates, addresses, jurisdiction, DPO email, regional crisis lines, support emails.
10. **Mobile responsive sanity pass** — open every screen on your phone, fix what's broken.

Once these ten are done, you're at "ready for friends-and-family alpha." Then Milestone 3 items unlock public soft launch.

---

## Where things stand today

Built and working:

- [x] Auth (login, signup, session restore, logout, broken-session recovery)
- [x] Onboarding (profile, preferences, languages, photos, prompts)
- [x] Photo-only swipe with mutual filters (gender, age relation, language)
- [x] 24h ± delayed chat unlock
- [x] Realtime chat with timestamps, unread tracking, emoji labels, unmatch, report
- [x] Date planning inside chat (place, time, emergency contact)
- [x] Dashboard ("Active for you", "You've been liked", unread, open matches)
- [x] Settings page (language, account info, T&C/Privacy stubs, GDPR export, soft delete)
- [x] Landing page (auth-aware)
- [x] Recent matches redesign (anonymous tiles for unstarted)
- [x] Auth-aware redirects standardized across all routes
- [x] `onboarded_at` gates everywhere
- [x] Email-confirm-aware signup flow
- [x] Soft-delete column + filtering on swipe API
- [x] `.in()` query chunking (URL-too-long fix at scale)
- [x] 500-user seed script with matches and seeded chat history
- [x] Empty states rewritten to feel intentional (Milestone 1)
- [x] Full English + Czech translation infrastructure (bonus, not on original list)
- [x] Real Terms & Conditions integrated, brand-styled (Milestone 2 — placeholders still TBD)
- [x] Real Privacy Policy integrated, brand-styled (Milestone 2 — placeholders still TBD)
- [x] `/onboarding/intro` three-principle teaching screen (photos only / chat opens later / no identity reveal)
- [x] Bio + 3-prompts removed from onboarding and profile (concept-aligned cleanup)
- [x] Onboarding form redesigned in brand style (was dark-theme leftover, unreadable)
- [x] Compatibility scoring and queue mix (personality engine — see section below)

---

## Personality / matching engine

Phases done:
- [x] **Phase A** — 25 sliders foundation. `personality_scores integer[]` column, brand-styled UI in `/profile`, dictionary keys for all 50 trait labels in en + cs, 5 grouped categories.
- [x] **Phase B** — silent compatibility scoring. `compatibility()` helper in `lib/personality.ts`, surfaced in `/api/swipe/debug` so distribution can be inspected.
- [x] **Phase C** — free tier matching. 1 priority slider, Beeline (people who liked you appear earlier), 30/70 mix on the swipe queue. Compat score visible in swipe (test-gated to two profiles).
- [x] Profile redesign: personality + priority merged into one section with inline yellow stars (no duplicate list).

Phases remaining (post-launch or Premium tier):
- [ ] **Phase D** — Subscription infrastructure (Stripe + webhooks, premium status helper).
- [ ] **Phase E** — Premium gates: 3 priority sliders, dealbreaker + range, 40/25/35 queue mix.
- [ ] **Phase F** — Boost mechanic: when a premium user right-swipes someone who passed their dealbreaker, they jump to the front of that person's queue.
- [ ] **Phase G** — Chat markers: ⭐ for dealbreaker pass, "compatible" tag for 3-priority match. Visible only inside chat.

Migrations applied (or to be applied) in Supabase:
- [x] `profiles.deleted_at` column for soft delete
- [x] `profiles.personality_scores integer[]` (length 25, constrained)
- [x] `profiles.priority_sliders integer[]` (length 1–3, constrained)

---

## Milestone 1 — Concept-tight v0 (internal team only)

The product holds together for ourselves before anyone outside sees it.

- [x] Empty states feel intentional, not abandoned
- [x] Onboarding teaches the concept (without lecturing) — `/onboarding/intro` ships this
- [ ] Match label generator: replace `BlueOtter42` with something that ages better
  - Options: more naming variety, soft poetic phrases, or the user picks their own visible-only-to-them label per match
- [ ] Forgot-password flow (Supabase has the primitive; UI is missing)
- [ ] Email confirmation flow tested end-to-end (we fixed the redirect bug; verify it actually delivers)
- [ ] Mobile responsive sanity check (iOS Safari + Android Chrome at minimum)
- [ ] Real legal addresses for Settings → Help (mailto currently points at a non-existent address)
- [ ] First-meeting safety advice surfaced in date-plan flow (since the check-in feature is paused)
- [ ] Decide what to do with the temporary compatibility-score display in `/swipe`. Currently gated to two test profiles via `COMPAT_DISPLAY_USER_IDS` in `app/swipe/page.tsx`. Three options at launch: remove entirely (most concept-aligned), keep visible to everyone (changes the "anti-bias by subtraction" claim), or expose as a Premium-only feature in Phase E. Decision must be made before any non-test user signs up.

---

## Milestone 2 — Closed beta (~50 invited users)

Real people, real data, but contained. Legal and safety must exist.

- [x] Real Terms of Service integrated (still has placeholders to fill: effective date, governing jurisdiction, arbitration body, regional crisis lines, registered address, real support emails)
- [x] Real Privacy Policy integrated (same: effective date, registered address, retention period, cookie policy link, DPO appointment confirmation)
- [ ] Account deletion does a hard purge, not just soft (or document what soft-delete actually does for GDPR)
- [ ] Data export tested with a realistic volume of matches/messages
- [ ] Reports backend: an admin queue or notification (right now reports just sit in the table)
- [ ] Photo content moderation, at minimum a NSFW screen on upload
- [ ] Signup throttling (rate limit by IP and email domain)
- [ ] Hosting configured (Vercel or chosen)
- [ ] Domain
- [ ] Transactional email service (Resend, Postmark, or similar) for confirmations and password resets
- [ ] Error tracking (Sentry or similar)
- [ ] Database backups verified, restore tested once
- [ ] Test data wiped (the 500 dummies) before the first real user signs up

---

## Milestone 3 — Public soft launch (~500 users)

Open the gate. Not advertised, but public sign-ups work.

- [ ] Cookie / consent banner (EU regs)
- [ ] Age verification beyond birth-year self-report (at least a "confirm 18+" gate; selfie verification later)
- [ ] DPO appointed and registered if EU
- [ ] Rate limiting on signup, swipe, message-send
- [ ] Photo verification flow (a selfie matched against profile photos)
- [ ] Performance baseline measured (page loads, swipe latency, chat send)
- [ ] Marketing landing page (the in-app `/` is for the app; a separate site explains the concept to outsiders)
- [ ] Launch positioning ("an app for people who hate dating apps", or whatever the real line is)
- [ ] Initial-user-pool strategy (invite codes? referral? organic?)

---

## Milestone 4 — Full public launch

Real volume, real expectations.

- [ ] Load testing (especially the swipe API and realtime chat)
- [ ] Accessibility audit
- [ ] Engagement loops working: users come back when they should and not when they shouldn't (Phase 4 of the original handoff)
- [ ] Empty states with retention behavior (the "intentionally psychological" empty states from the handoff)
- [ ] Press kit
- [ ] Customer support workflow (someone reads the support inbox)

---

## Future — Phone app phase

Native experience, the things browser can't do.

- [ ] iOS app
- [ ] Android app
- [ ] Push notifications
- [ ] Date safety check-in (the feature we paused — revive once push exists)
- [ ] SMS provider (Twilio or alternative) for emergency-contact alerts
- [ ] Re-evaluate the no-block-feature decision under real abuse load

---

## Things explicitly NOT on this list (and why)

- Bios, prompts, fun facts on profile — would weaken anti-bias-by-subtraction
- Identity reveal "after a few messages" — handoff explicitly non-negotiable
- Skip-the-wait paid tier — would gut the concept's core
- Block feature — handoff says intentionally skipped; revisit only if reports + unmatch don't cover real abuse

These should never be checked off. If pressure mounts to add them, the answer is to find another way to address whatever the underlying concern is.
