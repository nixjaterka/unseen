/**
 * Launch readiness check — run with:
 *   node scripts/test-launch.mjs [your-email@example.com]
 *
 * Checks:
 *   1. All 4 migrations applied (columns exist in profiles table)
 *   2. Supabase SMTP — triggers a password-reset email so you can verify it arrives
 *
 * The email argument is optional. If omitted, only the migration check runs.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (no dotenv dependency needed)
function loadEnv() {
  const envPath = resolve(__dirname, "../.env.local");
  const lines = readFileSync(envPath, "utf8").split("\n");
  const env = {};
  for (const line of lines) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) env[key.trim()] = rest.join("=").trim();
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  Could not read .env.local — make sure it exists at the project root.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ─── 1. MIGRATION CHECK ───────────────────────────────────────────────────────

const EXPECTED_COLUMNS = [
  // 2026-05-02-personality-scores.sql
  { col: "personality_scores", migration: "2026-05-02-personality-scores.sql" },
  // 2026-05-03-priority-sliders.sql
  { col: "priority_sliders",   migration: "2026-05-03-priority-sliders.sql" },
  // 2026-05-04-purge-scheduled-at.sql
  { col: "purge_scheduled_at", migration: "2026-05-04-purge-scheduled-at.sql" },
  // 2026-05-13-account-fields.sql
  { col: "first_name",         migration: "2026-05-13-account-fields.sql" },
  { col: "last_name",          migration: "2026-05-13-account-fields.sql" },
  { col: "date_of_birth",      migration: "2026-05-13-account-fields.sql" },
];

async function checkMigrations() {
  console.log("\n── Migrations ──────────────────────────────────");

  return checkMigrationsViaDummySelect();
}

async function checkMigrationsViaDummySelect() {
  // Try selecting each column — if it errors the column doesn't exist
  let allPassed = true;
  const checked = new Set();

  for (const { col, migration } of EXPECTED_COLUMNS) {
    if (checked.has(col)) continue;
    checked.add(col);

    const { error } = await admin
      .from("profiles")
      .select(col)
      .limit(1);

    if (error && error.message.includes("does not exist")) {
      console.log(`  ❌  ${col.padEnd(22)} MISSING — run ${migration}`);
      allPassed = false;
    } else {
      console.log(`  ✅  ${col.padEnd(22)} (${migration})`);
    }
  }

  return allPassed;
}

// ─── 2. EMAIL CHECK ───────────────────────────────────────────────────────────

async function checkEmail(testAddress) {
  console.log("\n── Email (SMTP) ────────────────────────────────");
  console.log(`  Sending password-reset email to ${testAddress} …`);

  // Use the anon client to trigger a real password-reset email flow —
  // this goes through the full SMTP pipeline just like a real user would.
  const anon = createClient(SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const { error } = await anon.auth.resetPasswordForEmail(testAddress, {
    redirectTo: "http://localhost:3000/reset-password",
  });

  if (error) {
    console.log(`  ❌  SMTP call failed: ${error.message}`);
    console.log("      → Double-check Host, Username (must be 'resend'), and API key in Supabase SMTP settings.");
    return false;
  }

  console.log("  ✅  Email triggered — check your inbox for a password-reset email from noreply@unseenapp.cz.");
  console.log("      (Note: Supabase won't send if the address isn't a registered user — use your real account email.)");
  console.log("      If it doesn't arrive within 2 min, the issue is Resend domain verification.");
  return true;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const testEmail = process.argv[2];

console.log("Unseen — launch readiness check");
console.log(`Project: ${SUPABASE_URL}`);

const migrationsOk = await checkMigrations();

let emailOk = null;
if (testEmail) {
  emailOk = await checkEmail(testEmail);
} else {
  console.log("\n── Email (SMTP) ────────────────────────────────");
  console.log("  Skipped — pass your email as an argument to test:");
  console.log("  node scripts/test-launch.mjs your@email.com");
}

console.log("\n── Summary ─────────────────────────────────────");
console.log(`  Migrations : ${migrationsOk ? "✅  all applied" : "❌  some missing (see above)"}`);
if (emailOk !== null) {
  console.log(`  SMTP email : ${emailOk ? "✅  sent — check inbox" : "❌  failed (see above)"}`);
}
console.log("");

if (!migrationsOk || emailOk === false) process.exit(1);
