import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { getSubscriptionStatus } from "../../../../lib/subscription";

// Returns the caller's premium status.
// Used by client-side pages to conditionally show premium features.
export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ isPremium: false, premiumUntil: null });
  }

  const status = await getSubscriptionStatus(user.id);
  return NextResponse.json(status);
}
