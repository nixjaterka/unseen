// Backfill personality_scores for all existing dummy users.
//
// Run after the personality_scores migration has been applied:
//   alter table profiles add column if not exists personality_scores integer[];
//
// Usage:
//   npx tsx scripts/backfillPersonality.ts
//
// Fast — no photo regen, no auth ops, just a profile update per dummy.

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

const DUMMY_EMAIL_PREFIX = "dummy";
const DUMMY_EMAIL_DOMAIN = "@unseen.app";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Same generator used in seedUsers.ts — clusters values so users with
// matching group tilts score high together.
function randomPersonalityScores(): number[] {
  const groupTilts = Array.from({ length: 5 }, () => randomInt(-30, 30));
  return Array.from({ length: 25 }, (_, i) => {
    const groupIndex = Math.floor(i / 5);
    const baseline = 50 + groupTilts[groupIndex];
    const noise = randomInt(-15, 15);
    return Math.max(0, Math.min(100, baseline + noise));
  });
}

async function listAllDummyAuthUsers() {
  const all: { id: string; email: string }[] = [];
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

    for (const u of matches) {
      all.push({ id: u.id, email: u.email ?? "" });
    }

    if (data.users.length < 200) break;
    page += 1;
  }

  return all;
}

async function main() {
  const startedAt = Date.now();

  console.log("Listing dummy users...");
  const dummies = await listAllDummyAuthUsers();
  console.log(`Found ${dummies.length} dummy users.`);

  if (dummies.length === 0) {
    console.log("Nothing to backfill.");
    return;
  }

  let updated = 0;
  let failed = 0;

  for (const dummy of dummies) {
    const scores = randomPersonalityScores();
    const { error } = await supabase
      .from("profiles")
      .update({ personality_scores: scores })
      .eq("user_id", dummy.id);

    if (error) {
      failed += 1;
      console.warn(`Update failed for ${dummy.email}:`, error.message);
    } else {
      updated += 1;
    }

    if ((updated + failed) % 50 === 0) {
      console.log(`  ${updated + failed}/${dummies.length} processed...`);
    }
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(
    `\nDone in ${elapsed}s. Updated ${updated}, failed ${failed}.`
  );
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exitCode = 1;
});
