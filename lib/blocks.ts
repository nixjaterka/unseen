import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Blocking is stored one-way (blocker → blocked) but ALWAYS enforced both
 * ways: if either person blocked the other, neither appears in the other's
 * deck and neither can send a message. These helpers use the service role,
 * so they see both directions — RLS only ever exposes your own blocks.
 */

/** Every user id in a block relationship with `userId`, in either direction. */
export async function getBlockedIds(userId: string): Promise<Set<string>> {
  const [outgoing, incoming] = await Promise.all([
    supabaseAdmin.from("blocked_users").select("blocked_id").eq("blocker_id", userId),
    supabaseAdmin.from("blocked_users").select("blocker_id").eq("blocked_id", userId),
  ]);

  const ids = new Set<string>();
  for (const row of outgoing.data ?? []) ids.add(row.blocked_id as string);
  for (const row of incoming.data ?? []) ids.add(row.blocker_id as string);
  return ids;
}

/** True if either of the two has blocked the other. */
export async function isBlockedPair(a: string, b: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("blocked_users")
    .select("id")
    .or(
      `and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`
    )
    .limit(1);

  return (data?.length ?? 0) > 0;
}
