import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// =============================================================================
// CONFIG
// =============================================================================

const TOTAL_DUMMIES = 500;
const DUMMY_PASSWORD = "Test123456!";
const DUMMY_EMAIL_DOMAIN = "@unseen.app";
const DUMMY_EMAIL_PREFIX = "dummy";

const CITIES = ["Prague", "Olomouc", "Brno", "Ostrava"];

const LANGUAGES_POOL = [
  "English",
  "Czech",
  "Slovak",
  "German",
  "French",
  "Spanish",
  "Italian",
  "Polish",
  "Dutch",
  "Portuguese",
  "Romanian",
  "Hungarian",
];

const AGE_RELATIONS = [
  "about your age",
  "a bit older than you",
  "older than you",
  "much older than you",
  "a bit younger than you",
  "younger than you",
  "much younger than you",
];

const ATMOSPHERES = [
  "Midnight",
  "Velvet",
  "Silent",
  "Golden",
  "Hidden",
  "Calm",
  "Soft",
  "Wild",
  "Warm",
  "Deep",
  "Quiet",
  "Pale",
  "Amber",
  "Hollow",
  "Tender",
  "Strange",
  "Distant",
  "Still",
  "Salt",
  "Bare",
];

const NOUNS = [
  "Harbour",
  "Tide",
  "Bloom",
  "Flame",
  "Drift",
  "Echo",
  "Shore",
  "Rain",
  "Stone",
  "Moon",
  "River",
  "Smoke",
  "Cloud",
  "Wave",
  "Glass",
  "Lake",
  "Path",
  "Field",
  "Light",
  "Sand",
];

const BIO_FRAGMENTS = [
  "Dog person who reads too many cookbooks.",
  "Long walks, mostly in winter.",
  "Building things in my spare time.",
  "Coffee first, talk later.",
  "Currently into pottery and Vivaldi.",
  "Quiet afternoons, loud kitchens.",
  "Trying to learn a new language each year.",
  "Mountains in summer, museums in winter.",
  "Looking for someone curious.",
  "Mostly normal. Sometimes loud.",
  "Two cats, one ongoing knitting project.",
  "More books than shelves.",
];

// Real existing user IDs to also create matches against.
const TARGET_USER_IDS = [
  "770288df-fedc-4ae8-b5f1-e5e4e0157e5e",
  "f301370f-8cff-4846-9473-4771d4923c46",
];

const MATCHES_PER_TARGET = 15;
const DUMMY_DUMMY_MATCHES = 200;
const ONE_SIDED_LIKES_PER_TARGET = 20;

const MESSAGE_TEMPLATES = [
  "Hey, how's your week going so far?",
  "Coffee or tea person?",
  "What are you reading right now?",
  "Tell me something most people don't notice about you.",
  "I love a good Sunday plan. What's yours?",
  "Random — early bird or night owl?",
  "What's the last thing that made you laugh out loud?",
  "Got any travel coming up?",
  "Favorite walk in the city?",
  "I'm a sucker for a good bookstore. You?",
  "What's something small that made you happy today?",
  "Honest opinion: pineapple on pizza?",
  "Working on anything you're excited about lately?",
  "What's a song you've had on repeat?",
  "Mountains, sea, or city for a weekend?",
  "Tell me about a hobby you've picked up recently.",
  "Any restaurant you keep going back to?",
  "What's the best concert you've been to?",
  "Cook at home or eat out?",
  "I'm trying to read more this year. Any recs?",
  "Cats, dogs, or peace and quiet?",
  "What did you eat for breakfast?",
  "Plans for the weekend?",
  "Are you a planner or a wing-it kind of person?",
  "What part of the day do you like best?",
  "How's your Monday treating you?",
  "What's the most underrated thing in your city?",
  "Any guilty-pleasure shows?",
  "How long have you been on Unseen?",
  "What drew you to this app?",
];

// =============================================================================
// HELPERS
// =============================================================================

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  // inclusive both ends
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomSubset<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
}

function randomLanguages(): string[] {
  const count = randomInt(1, 3);
  // Bias toward English being included so most dummies share a language with each other.
  if (Math.random() < 0.7) {
    const rest = randomSubset(
      LANGUAGES_POOL.filter((l) => l !== "English"),
      Math.max(0, count - 1)
    );
    return ["English", ...rest];
  }
  return randomSubset(LANGUAGES_POOL, count);
}

function randomBirthYear(): number {
  const age = randomInt(18, 50);
  return new Date().getFullYear() - age;
}

function randomBio(): string | null {
  if (Math.random() < 0.2) return null; // some users leave it blank
  const count = randomInt(1, 2);
  return randomSubset(BIO_FRAGMENTS, count).join(" ");
}

function randomPreferredGender(): string {
  return Math.random() < 0.5 ? "man" : "woman";
}

function randomPreferredAgeRelations(): string[] {
  const count = randomInt(2, 5);
  return randomSubset(AGE_RELATIONS, count);
}

function generateMatchLabel(): string {
  const atmosphere = randomItem(ATMOSPHERES);
  const noun = randomItem(NOUNS);
  const number = randomInt(10, 99); // always 2 digits
  return `${atmosphere}${noun}${number}`;
}

// 25 personality slider values (0–100). Tilts each of the 5 groups by a random
// amount so two users with similar tilts score high together and opposite
// tilts score low. More interesting distribution than pure uniform random.
function randomPersonalityScores(): number[] {
  const groupTilts = Array.from({ length: 5 }, () => randomInt(-30, 30));
  return Array.from({ length: 25 }, (_, i) => {
    const groupIndex = Math.floor(i / 5);
    const baseline = 50 + groupTilts[groupIndex];
    const noise = randomInt(-15, 15);
    return Math.max(0, Math.min(100, baseline + noise));
  });
}

function avatarStyleForGender(gender: string): string {
  return gender === "man" ? "adventurer" : "lorelei";
}

function avatarBackgroundForGender(gender: string): string {
  return gender === "man" ? "dbeafe" : "fce7f3";
}

function randomPhotoCount(): number {
  return randomInt(1, 6);
}

function hasSharedLanguage(a: string[] | null, b: string[] | null): boolean {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  const setA = new Set(a.map((x) => x.toLowerCase()));
  return b.some((lang) => setA.has(lang.toLowerCase()));
}

async function listAllDummyAuthUsers() {
  const all: { id: string; email: string | undefined }[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;

    const matches = data.users.filter((u) =>
      (u.email ?? "").startsWith(DUMMY_EMAIL_PREFIX) &&
      (u.email ?? "").endsWith(DUMMY_EMAIL_DOMAIN)
    );

    all.push(...matches.map((u) => ({ id: u.id, email: u.email ?? undefined })));

    if (data.users.length < 200) break;
    page += 1;
  }

  return all;
}

// =============================================================================
// PHASE 1 — WIPE EXISTING DUMMIES
// =============================================================================

async function wipeExistingDummies() {
  console.log("\n--- Phase 1: wiping existing dummies ---");

  const dummies = await listAllDummyAuthUsers();
  console.log(`Found ${dummies.length} existing dummy auth users.`);

  if (dummies.length === 0) return;

  const dummyIds = dummies.map((d) => d.id);

  // 1) Photos: remove storage objects + DB rows
  const { data: photoRows } = await supabase
    .from("photos")
    .select("id, path, user_id")
    .in("user_id", dummyIds);

  const paths = (photoRows ?? []).map((p) => p.path).filter(Boolean) as string[];
  if (paths.length > 0) {
    // remove() can take many paths but be safe and chunk
    const chunkSize = 100;
    for (let i = 0; i < paths.length; i += chunkSize) {
      const chunk = paths.slice(i, i + chunkSize);
      const { error } = await supabase.storage.from("user_photos").remove(chunk);
      if (error) console.warn("Storage remove error:", error.message);
    }
    console.log(`Removed ${paths.length} storage objects.`);
  }

  await supabase.from("photos").delete().in("user_id", dummyIds);
  console.log("Deleted photo rows.");

  // 2) Matches involving dummies (and dependent rows)
  const { data: matchRows } = await supabase
    .from("matches")
    .select("id, user_a, user_b")
    .or(
      `user_a.in.(${dummyIds.join(",")}),user_b.in.(${dummyIds.join(",")})`
    );

  const matchIds = (matchRows ?? []).map((m) => m.id);

  if (matchIds.length > 0) {
    await supabase.from("messages").delete().in("match_id", matchIds);
    await supabase.from("match_preferences").delete().in("match_id", matchIds);
    await supabase.from("date_plans").delete().in("match_id", matchIds);
    await supabase.from("reports").delete().in("match_id", matchIds);
    await supabase.from("matches").delete().in("id", matchIds);
    console.log(`Deleted ${matchIds.length} matches and their dependent rows.`);
  }

  // 3) Swipes (where dummy is swiper or target)
  await supabase.from("swipes").delete().in("swiper_id", dummyIds);
  await supabase.from("swipes").delete().in("target_id", dummyIds);
  console.log("Deleted swipes.");

  // 4) Reports filed by dummies (extra safety, beyond match-tied ones)
  await supabase.from("reports").delete().in("reporter_id", dummyIds);
  await supabase.from("reports").delete().in("reported_id", dummyIds);

  // 5) Profile prompts
  await supabase.from("profile_prompts").delete().in("user_id", dummyIds);

  // 6) Profiles
  await supabase.from("profiles").delete().in("user_id", dummyIds);
  console.log("Deleted profile rows.");

  // 7) Auth users (must be last)
  let deletedAuth = 0;
  for (const d of dummies) {
    const { error } = await supabase.auth.admin.deleteUser(d.id);
    if (error) {
      console.warn(`Auth delete error for ${d.email}:`, error.message);
    } else {
      deletedAuth += 1;
    }
  }
  console.log(`Deleted ${deletedAuth} auth users.`);
}

// =============================================================================
// PHASE 2 — CREATE FRESH DUMMIES
// =============================================================================

type DummyProfile = {
  user_id: string;
  email: string;
  birth_year: number;
  gender: string;
  preferred_gender: string;
  preferred_age_relations: string[];
  city: string;
  bio: string | null;
  languages: string[];
};

async function createDummy(i: number): Promise<DummyProfile | null> {
  const email = `${DUMMY_EMAIL_PREFIX}${i}${DUMMY_EMAIL_DOMAIN}`;
  const gender = i % 2 === 0 ? "woman" : "man";
  const birthYear = randomBirthYear();
  const preferredGender = randomPreferredGender();
  const preferredAgeRelations = randomPreferredAgeRelations();
  const city = randomItem(CITIES);
  const bio = randomBio();
  const languages = randomLanguages();

  const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
    email,
    password: DUMMY_PASSWORD,
    email_confirm: true,
  });

  if (userErr || !userData?.user) {
    console.warn(`Auth create failed for ${email}:`, userErr?.message);
    return null;
  }

  const userId = userData.user.id;

  const { error: profileErr } = await supabase.from("profiles").insert({
    user_id: userId,
    birth_year: birthYear,
    gender,
    preferred_gender: preferredGender,
    preferred_age_relations: preferredAgeRelations,
    city,
    bio,
    languages,
    personality_scores: randomPersonalityScores(),
    onboarded_at: new Date().toISOString(),
  });

  if (profileErr) {
    console.warn(`Profile insert failed for ${email}:`, profileErr.message);
    return null;
  }

  return {
    user_id: userId,
    email,
    birth_year: birthYear,
    gender,
    preferred_gender: preferredGender,
    preferred_age_relations: preferredAgeRelations,
    city,
    bio,
    languages,
  };
}

// =============================================================================
// PHASE 3 — PHOTOS
// =============================================================================

async function fetchAvatar(seed: string, gender: string): Promise<Uint8Array> {
  const style = avatarStyleForGender(gender);
  const backgroundColor = avatarBackgroundForGender(gender);
  const url = `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(
    seed
  )}&size=512&backgroundColor=${backgroundColor}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`avatar fetch failed for ${seed}`);

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function uploadPhotosFor(profile: DummyProfile) {
  const count = randomPhotoCount();

  for (let position = 1; position <= count; position++) {
    try {
      const seed = `${profile.email}-photo-${position}`;
      const fileBytes = await fetchAvatar(seed, profile.gender);
      const filePath = `${profile.user_id}/dummy-${position}-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("user_photos")
        .upload(filePath, fileBytes, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.warn(`Upload error ${profile.email} #${position}:`, uploadError.message);
        continue;
      }

      const { error: photoErr } = await supabase.from("photos").insert({
        user_id: profile.user_id,
        path: filePath,
        is_primary: position === 1,
        position,
      });

      if (photoErr) {
        console.warn(`Photo row error ${profile.email} #${position}:`, photoErr.message);
      }
    } catch (err) {
      console.warn(`Avatar generate failed ${profile.email} #${position}:`, err);
    }
  }
}

// =============================================================================
// PHASE 4 — DUMMY ↔ DUMMY MATCHES
// =============================================================================

function isMutuallyCompatible(a: DummyProfile, b: DummyProfile): boolean {
  if (a.user_id === b.user_id) return false;
  if (a.gender !== b.preferred_gender) return false;
  if (b.gender !== a.preferred_gender) return false;
  if (!hasSharedLanguage(a.languages, b.languages)) return false;
  return true;
}

function pickUnlockAt(): { unlockIso: string; alreadyUnlocked: boolean } {
  // 65% already unlocked (chat available), 35% still locked
  const alreadyUnlocked = Math.random() < 0.65;
  const now = new Date();

  if (alreadyUnlocked) {
    // Unlocked sometime in the past 1–14 days
    const daysAgo = randomInt(0, 14);
    const minutesAgo = randomInt(0, 60 * 24);
    const t = new Date(now.getTime() - (daysAgo * 24 * 60 + minutesAgo) * 60 * 1000);
    return { unlockIso: t.toISOString(), alreadyUnlocked: true };
  }

  // Still locked — unlock somewhere in the next 24h
  const minutesAhead = randomInt(10, 24 * 60);
  const t = new Date(now.getTime() + minutesAhead * 60 * 1000);
  return { unlockIso: t.toISOString(), alreadyUnlocked: false };
}

async function insertSwipe(
  swiperId: string,
  targetId: string,
  direction: "like" | "pass"
) {
  const { error } = await supabase.from("swipes").insert({
    swiper_id: swiperId,
    target_id: targetId,
    direction,
  });
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    console.warn(`Swipe insert error ${swiperId}->${targetId}:`, error.message);
  }
}

type CreatedMatch = {
  id: number;
  user_a: string;
  user_b: string;
  unlockIso: string;
  alreadyUnlocked: boolean;
  unmatchedAt: string | null;
};

async function insertMatch(userA: string, userB: string): Promise<CreatedMatch | null> {
  const { unlockIso, alreadyUnlocked } = pickUnlockAt();
  const label = generateMatchLabel();

  // 10% of matches are already unmatched (testing the "ended" state)
  const isUnmatched = Math.random() < 0.1;
  const unmatched_at = isUnmatched ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("matches")
    .insert({
      user_a: userA,
      user_b: userB,
      match_label: label,
      chat_unlock_at: unlockIso,
      unmatched_at,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.warn(`Match insert error ${userA}<->${userB}:`, error?.message);
    return null;
  }

  return {
    id: data.id,
    user_a: userA,
    user_b: userB,
    unlockIso,
    alreadyUnlocked,
    unmatchedAt: unmatched_at,
  };
}

async function createDummyDummyMatches(dummies: DummyProfile[]) {
  console.log(`\n--- Phase 4: creating ~${DUMMY_DUMMY_MATCHES} dummy matches ---`);

  const made = new Set<string>();
  let attempts = 0;
  let created = 0;

  while (created < DUMMY_DUMMY_MATCHES && attempts < DUMMY_DUMMY_MATCHES * 20) {
    attempts += 1;
    const a = randomItem(dummies);
    const b = randomItem(dummies);

    if (!isMutuallyCompatible(a, b)) continue;

    const key = [a.user_id, b.user_id].sort().join("|");
    if (made.has(key)) continue;
    made.add(key);

    await insertSwipe(a.user_id, b.user_id, "like");
    await insertSwipe(b.user_id, a.user_id, "like");
    await insertMatch(a.user_id, b.user_id);
    created += 1;

    if (created % 25 === 0) console.log(`  ${created} matches created...`);
  }

  console.log(`Created ${created} dummy↔dummy matches (${attempts} pair attempts).`);
}

// =============================================================================
// PHASE 5 — MATCHES WITH TARGET USER IDs
// =============================================================================

type TargetProfile = {
  user_id: string;
  gender: string | null;
  preferred_gender: string | null;
  languages: string[] | null;
};

async function loadTargetProfile(userId: string): Promise<TargetProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, gender, preferred_gender, languages")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn(`Target profile load error ${userId}:`, error.message);
    return null;
  }
  return data as TargetProfile | null;
}

function dummyCompatibleWithTarget(d: DummyProfile, t: TargetProfile): boolean {
  if (!t.gender || !t.preferred_gender) return false;
  if (d.gender !== t.preferred_gender) return false;
  if (d.preferred_gender !== t.gender) return false;
  if (Array.isArray(t.languages) && t.languages.length > 0) {
    if (!hasSharedLanguage(d.languages, t.languages)) return false;
  }
  return true;
}

async function createTargetMatches(
  dummies: DummyProfile[],
  targetId: string
): Promise<CreatedMatch[]> {
  console.log(`\n--- Phase 5: matches with target ${targetId} ---`);

  const target = await loadTargetProfile(targetId);
  if (!target) {
    console.warn(`Skipping target ${targetId}: profile not found.`);
    return [];
  }

  console.log(
    `Target gender=${target.gender} preferred=${target.preferred_gender} languages=${target.languages?.join(",") ?? "—"}`
  );

  const compatible = dummies.filter((d) => dummyCompatibleWithTarget(d, target));
  console.log(`${compatible.length} compatible dummies for this target.`);

  if (compatible.length === 0) {
    console.warn("No compatible dummies. Falling back to random dummies (matches will exist but the swipe filter wouldn't have surfaced them).");
  }

  const pool = compatible.length > 0 ? compatible : dummies;
  const picks = randomSubset(pool, Math.min(MATCHES_PER_TARGET, pool.length));

  const createdMatches: CreatedMatch[] = [];

  for (const dummy of picks) {
    await insertSwipe(dummy.user_id, targetId, "like");
    await insertSwipe(targetId, dummy.user_id, "like");
    const m = await insertMatch(targetId, dummy.user_id);
    if (m) createdMatches.push(m);
  }

  console.log(`Created ${createdMatches.length} matches with ${targetId}.`);

  // One-sided likes from dummies → target (populates "you've been liked")
  const oneSidedPool = pool.filter((d) => !picks.find((p) => p.user_id === d.user_id));
  const likes = randomSubset(
    oneSidedPool,
    Math.min(ONE_SIDED_LIKES_PER_TARGET, oneSidedPool.length)
  );

  for (const dummy of likes) {
    await insertSwipe(dummy.user_id, targetId, "like");
  }

  console.log(`Created ${likes.length} one-sided likes toward ${targetId}.`);

  return createdMatches;
}

// =============================================================================
// PHASE 6 — MESSAGES ON HALF OF UNLOCKED TARGET MATCHES
// =============================================================================

async function seedMessagesForMatch(match: CreatedMatch, targetId: string) {
  const dummyId = match.user_a === targetId ? match.user_b : match.user_a;

  const count = randomInt(3, 12);
  const templates = randomSubset(MESSAGE_TEMPLATES, count);

  const unlockMs = new Date(match.unlockIso).getTime();
  const nowMs = Date.now();

  // Distribute messages evenly between unlock and now, with jitter.
  const startMs = unlockMs + 60 * 1000; // 1 min after unlock
  const endMs = nowMs - 60 * 1000; // up to a minute ago
  const span = Math.max(5 * 60 * 1000, endMs - startMs); // at least 5 min span

  let currentSender = Math.random() < 0.5 ? targetId : dummyId;

  const rows: {
    match_id: number;
    sender_id: string;
    content: string;
    created_at: string;
  }[] = [];

  for (let i = 0; i < count; i++) {
    if (i > 0 && Math.random() < 0.7) {
      // Mostly alternate, occasionally two from the same sender in a row.
      currentSender = currentSender === targetId ? dummyId : targetId;
    }

    const bucketStart = startMs + (i * span) / count;
    const bucketWidth = span / count;
    const t = bucketStart + Math.random() * bucketWidth;

    rows.push({
      match_id: match.id,
      sender_id: currentSender,
      content: templates[i],
      created_at: new Date(t).toISOString(),
    });
  }

  const { error } = await supabase.from("messages").insert(rows);
  if (error) {
    console.warn(`Messages insert error for match ${match.id}:`, error.message);
    return;
  }

  // Set target's read state. ~50% read everything, ~50% have an unread tail.
  const lastFromDummy = [...rows].reverse().find((r) => r.sender_id === dummyId);

  let lastReadAt: string;
  if (Math.random() < 0.5 || !lastFromDummy) {
    // All read.
    lastReadAt = new Date(nowMs).toISOString();
  } else {
    // Unread: target's last_read_at sits BEFORE the dummy's last message.
    const ms = new Date(lastFromDummy.created_at).getTime() - 5 * 60 * 1000;
    lastReadAt = new Date(Math.max(unlockMs, ms)).toISOString();
  }

  const { error: prefErr } = await supabase
    .from("match_preferences")
    .upsert(
      {
        match_id: match.id,
        user_id: targetId,
        last_read_at: lastReadAt,
        updated_at: new Date(nowMs).toISOString(),
      },
      { onConflict: "match_id,user_id" }
    );

  if (prefErr) {
    console.warn(`match_preferences upsert error for match ${match.id}:`, prefErr.message);
  }
}

async function seedMessagesForTarget(matches: CreatedMatch[], targetId: string) {
  const eligible = matches.filter((m) => m.alreadyUnlocked && !m.unmatchedAt);
  const halfCount = Math.floor(eligible.length / 2);
  const subset = randomSubset(eligible, halfCount);

  console.log(
    `Seeding messages on ${subset.length} of ${eligible.length} unlocked matches for target ${targetId}.`
  );

  for (const match of subset) {
    await seedMessagesForMatch(match, targetId);
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const startedAt = Date.now();

  try {
    await wipeExistingDummies();

    console.log(`\n--- Phase 2: creating ${TOTAL_DUMMIES} dummies ---`);
    const profiles: DummyProfile[] = [];
    for (let i = 0; i < TOTAL_DUMMIES; i++) {
      const p = await createDummy(i);
      if (p) profiles.push(p);
      if ((i + 1) % 50 === 0) {
        console.log(`  ${i + 1}/${TOTAL_DUMMIES} created...`);
      }
    }
    console.log(`Created ${profiles.length} profiles.`);

    console.log(`\n--- Phase 3: uploading photos ---`);
    let done = 0;
    for (const p of profiles) {
      await uploadPhotosFor(p);
      done += 1;
      if (done % 25 === 0) {
        console.log(`  photos: ${done}/${profiles.length}`);
      }
    }
    console.log(`Photos uploaded for ${profiles.length} users.`);

    await createDummyDummyMatches(profiles);

    const targetMatchesByTarget = new Map<string, CreatedMatch[]>();
    for (const targetId of TARGET_USER_IDS) {
      const created = await createTargetMatches(profiles, targetId);
      targetMatchesByTarget.set(targetId, created);
    }

    console.log(`\n--- Phase 6: messages on half of unlocked target matches ---`);
    for (const targetId of TARGET_USER_IDS) {
      const matches = targetMatchesByTarget.get(targetId) ?? [];
      await seedMessagesForTarget(matches, targetId);
    }

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`\nDone in ${elapsed}s.`);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  }
}

main();
