import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Voice messages unlock once BOTH people have actually said something.
 *
 * Counting total messages would let one person unlock the feature by sending
 * ten in a row, so the threshold is per side: each must have sent at least
 * MIN_MESSAGES_EACH (three — Nikols number). That makes it a signal of mutual engagement rather than
 * of one person's persistence.
 *
 * The gate exists because a voice carries accent, age and mood — things the
 * app otherwise keeps hidden until people choose to reveal them. Waiting a
 * few messages means nobody hears the other before deciding to keep talking.
 */
export const MIN_MESSAGES_EACH = 3;

export type VoiceGate = {
  unlocked: boolean;
  mine: number;
  theirs: number;
  needed: number;
};

export async function checkVoiceGate(
  matchId: number,
  userId: string,
  otherUserId: string
): Promise<VoiceGate> {
  const [mineResult, theirsResult] = await Promise.all([
    supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("match_id", matchId)
      .eq("sender_id", userId)
      .eq("kind", "text"),
    supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("match_id", matchId)
      .eq("sender_id", otherUserId)
      .eq("kind", "text"),
  ]);

  const mine = mineResult.count ?? 0;
  const theirs = theirsResult.count ?? 0;

  return {
    unlocked: mine >= MIN_MESSAGES_EACH && theirs >= MIN_MESSAGES_EACH,
    mine,
    theirs,
    needed: MIN_MESSAGES_EACH,
  };
}
