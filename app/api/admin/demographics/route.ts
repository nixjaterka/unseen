import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes((user.email ?? "").toLowerCase())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Fetch all profiles (only the columns we need)
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("user_id, gender, preferred_gender, birth_year, city, onboarded_at")
    .not("onboarded_at", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = profiles ?? [];

  // Gender breakdown
  const genderCount: Record<string, number> = {};
  for (const p of rows) {
    const g = p.gender ?? "unknown";
    genderCount[g] = (genderCount[g] ?? 0) + 1;
  }

  // Preferred gender breakdown
  const preferredGenderCount: Record<string, number> = {};
  for (const p of rows) {
    const g = p.preferred_gender ?? "unknown";
    preferredGenderCount[g] = (preferredGenderCount[g] ?? 0) + 1;
  }

  // Age distribution — only users with a birth_year (Google-signup users without DOB are excluded)
  const currentYear = new Date().getFullYear();
  const ageBuckets: Record<string, number> = {
    "18–24": 0, "25–29": 0, "30–34": 0,
    "35–39": 0, "40–49": 0, "50+": 0,
  };
  let totalAge = 0;
  let ageCount = 0;
  let missingDob = 0;
  for (const p of rows) {
    if (!p.birth_year) { missingDob++; continue; }
    const age = currentYear - p.birth_year;
    totalAge += age;
    ageCount++;
    if (age < 25) ageBuckets["18–24"]++;
    else if (age < 30) ageBuckets["25–29"]++;
    else if (age < 35) ageBuckets["30–34"]++;
    else if (age < 40) ageBuckets["35–39"]++;
    else if (age < 50) ageBuckets["40–49"]++;
    else ageBuckets["50+"]++;
  }
  const avgAge = ageCount > 0 ? Math.round(totalAge / ageCount) : null;

  // Top cities
  const cityCount: Record<string, number> = {};
  for (const p of rows) {
    const c = (p.city ?? "").trim() || "unknown";
    cityCount[c] = (cityCount[c] ?? 0) + 1;
  }
  const topCities = Object.entries(cityCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([city, count]) => ({ city, count }));

  // Average photos per user (only approved photos)
  const { data: photoData } = await supabaseAdmin
    .from("photos")
    .select("user_id")
    .eq("moderation_status", "approved")
    .is("deleted_at", null);

  let avgPhotos: number | null = null;
  if (photoData && rows.length > 0) {
    avgPhotos = Math.round((photoData.length / rows.length) * 10) / 10;
  }

  // Users with at least 1 approved photo
  const usersWithPhotos = new Set((photoData ?? []).map((p: { user_id: string }) => p.user_id)).size;
  const pctWithPhotos = rows.length > 0 ? Math.round((usersWithPhotos / rows.length) * 100) : 0;

  return NextResponse.json({
    total: rows.length,
    missingDob,
    gender: genderCount,
    preferredGender: preferredGenderCount,
    ageBuckets,
    avgAge,
    topCities,
    avgPhotos,
    pctWithPhotos,
  });
}
