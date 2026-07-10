import type { User } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { supabaseServer } from "./supabaseServer";
import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Resolve the authenticated user for an API route.
 *
 * Web clients authenticate via Supabase SSR cookies. The mobile apps (React
 * Native) can't share those cookies, so they send the Supabase access token
 * as `Authorization: Bearer <jwt>`. Check the header first, then fall back
 * to cookies — existing web behaviour is unchanged.
 */
export async function getApiUser(): Promise<User | null> {
  const h = await headers();
  const auth = h.get("authorization");

  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length);
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user) return data.user;
    // Invalid/expired token — don't fall through to cookies: the caller
    // clearly intended token auth, and mixing the two hides real failures.
    return null;
  }

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}
