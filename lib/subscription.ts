/**
 * Server-side subscription utility.
 *
 * isPremium(userId) — returns true when the user has an active premium
 * subscription (premium_until is in the future).
 *
 * Always call from API routes with supabaseAdmin — never trust the client.
 */

import { supabaseAdmin } from "./supabaseAdmin";

export async function isPremium(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("premium_until")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.premium_until) return false;
  return new Date(data.premium_until) > new Date();
}

/** Convenience: returns both flags in one DB round-trip. */
export async function getSubscriptionStatus(userId: string): Promise<{
  isPremium: boolean;
  premiumUntil: string | null;
}> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("premium_until")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return { isPremium: false, premiumUntil: null };

  const premiumUntil = data.premium_until ?? null;
  const active = premiumUntil ? new Date(premiumUntil) > new Date() : false;

  return { isPremium: active, premiumUntil };
}
