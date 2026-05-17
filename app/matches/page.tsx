"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import BottomNav from "../components/BottomNav";
import { useT } from "../../lib/i18n/I18nProvider";
import { compatibility, hasScores } from "../../lib/personality";
const EMOJI_GROUPS = [
  { label: "On fire",    emojis: ["🔥", "💘", "😍", "🥰", "💫", "⭐"] },
  { label: "Playful",   emojis: ["😏", "🙈", "🫠", "🥴", "😳", "🤭"] },
  { label: "Meh",       emojis: ["🥱", "💀", "🚩", "👀", "🫤", "❄️"] },
  { label: "Angry",     emojis: ["😠", "😤", "🤬", "💢"] },
  { label: "Hearts",    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎"] },
  { label: "Hands",     emojis: ["👍", "👎", "🤝", "🤙", "👌", "🫶", "🙌"] },
  { label: "Animals",   emojis: ["🦊", "🐶", "🦄", "🐻", "🐬", "🦋", "🐙", "🦔", "🐝", "🐺"] },
  { label: "Vibe",      emojis: ["🌊", "✨", "🌙", "🌸", "☕", "🍷"] },
];

type MatchRow = {
  id: number;
  match_label: string;
  user_a: string;
  user_b: string;
  unmatched_at: string | null;
};

type ProfileRow = {
  user_id: string;
  birth_year: number | null;
  languages: string[] | null;
  personality_scores: number[] | null;
  priority_sliders: number[] | null;
};

function profileBirthYear(p: ProfileRow | undefined): number | null {
  if (!p) return null;
  return p.birth_year ?? null;
}

type MatchCard = {
  id: number;
  match_label: string;
  ageRelationKey: string | null;
  languages: string[];
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: boolean;
  emoji: string | null;
  isHighCompat: boolean;
  isArchived: boolean;
};

function getRelativeAgeLabel(viewerBirthYear: number, otherBirthYear: number) {
  const viewerAge = new Date().getFullYear() - viewerBirthYear;
  const diff = otherBirthYear - viewerBirthYear; // positive = other is younger, negative = older
  const absDiff = Math.abs(diff);

  let same = 2;
  let bit = 5;
  let older = 9;

  if (viewerAge < 25) {
    same = 1;
    bit = 3;
    older = 6;
  } else if (viewerAge <= 34) {
    same = 2;
    bit = 5;
    older = 9;
  } else if (viewerAge <= 49) {
    same = 4;
    bit = 7;
    older = 12;
  } else {
    same = 5;
    bit = 9;
    older = 15;
  }

  if (absDiff <= same) return "about your age";

  if (diff > 0) {
    if (absDiff <= bit) return "a bit younger than you";
    if (absDiff <= older) return "younger than you";
    return "much younger than you";
  } else {
    if (absDiff <= bit) return "a bit older than you";
    if (absDiff <= older) return "older than you";
    return "much older than you";
  }
}

export default function MatchesPage() {
  const router = useRouter();
  const t = useT();

  async function saveEmoji(matchId: number, nextEmoji: string | null) {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;

    if (!uid) return;

    const { error } = await supabase
      .from("match_preferences")
      .upsert(
        {
          match_id: matchId,
          user_id: uid,
          emoji: nextEmoji,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "match_id,user_id" }
      );

    if (error) {
      console.error(error.message);
      return;
    }

    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId ? { ...m, emoji: nextEmoji } : m
      )
    );

    setOpenEmojiFor(null);
  }
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [archivedMatches, setArchivedMatches] = useState<MatchCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [openEmojiFor, setOpenEmojiFor] = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  async function hideArchivedMatch(matchId: number) {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) return;
    await supabase.from("match_preferences").upsert(
      { match_id: matchId, user_id: uid, hidden_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: "match_id,user_id" }
    );
    setArchivedMatches((prev) => prev.filter((m) => m.id !== matchId));
  }

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;

      if (!uid) {
        router.replace("/login");
        return;
      }

      const nowIso = new Date().toISOString();

      // Wave 1: onboarding check + all matches (active + archived)
      const [ownProfileResult, matchesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("onboarded_at, personality_scores, priority_sliders")
          .eq("user_id", uid)
          .maybeSingle(),
        supabase
          .from("matches")
          .select("id, match_label, user_a, user_b, chat_unlock_at, unmatched_at")
          .lte("chat_unlock_at", nowIso),
      ]);

      const ownProfile = ownProfileResult.data;

      if (!ownProfile?.onboarded_at) {
        router.replace("/onboarding");
        return;
      }

      // Show the page shell immediately after auth is confirmed
      setLoading(false);

      if (matchesResult.error) return;

      const allMatches =
        (matchesResult.data as MatchRow[] | null)?.filter(
          (m) => m.user_a === uid || m.user_b === uid
        ) ?? [];

      const myMatches = allMatches.filter((m) => !m.unmatched_at);
      const myArchivedMatches = allMatches.filter((m) => !!m.unmatched_at);

      const matchIds = allMatches.map((m) => m.id);
      const userIdsToLoad = Array.from(
        new Set(allMatches.flatMap((m) => [m.user_a, m.user_b]))
      );

      // Wave 2: profiles + messages + prefs all in parallel
      const [profilesResult, messagesResult, prefsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, birth_year, languages, personality_scores, priority_sliders")
          .in("user_id", userIdsToLoad),
        supabase
          .from("messages")
          .select("match_id, sender_id, content, created_at")
          .in("match_id", matchIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("match_preferences")
          .select("match_id, emoji, last_read_at, hidden_at")
          .eq("user_id", uid)
          .in("match_id", matchIds),
      ]);

      if (profilesResult.error || messagesResult.error || prefsResult.error) return;

      const profiles = (profilesResult.data as ProfileRow[] | null) ?? [];
      const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

      const myProfile = profileMap.get(uid);
      if (!myProfile) return;

      // Viewer's priorities — used to decide whether to show the compat star
      const viewerPriorities: number[] = Array.isArray(ownProfile?.priority_sliders)
        ? (ownProfile.priority_sliders as number[]).filter(
            (i) => Number.isInteger(i) && i >= 0
          )
        : [];
      const viewerHasPriorities = viewerPriorities.length > 0;

      const messagesData = messagesResult.data;
      const prefsData = prefsResult.data;

      const latestMessageMap = new Map<number, string>();
      const latestMessageAtMap = new Map<number, string>();
      const latestIncomingAtMap = new Map<number, string>();

      const youPrefix = t("matches.you_prefix");
      (messagesData ?? []).forEach((msg: any) => {
        if (!latestMessageMap.has(msg.match_id)) {
          const prefix = msg.sender_id === uid ? youPrefix : "";
          latestMessageMap.set(msg.match_id, `${prefix}${msg.content}`);
          latestMessageAtMap.set(msg.match_id, msg.created_at);
        }

        if (msg.sender_id !== uid && !latestIncomingAtMap.has(msg.match_id)) {
          latestIncomingAtMap.set(msg.match_id, msg.created_at);
        }
      });

      const emojiMap = new Map<number, string | null>();
      const lastReadMap = new Map<number, string | null>();
      const hiddenMatchIds = new Set<number>();
      (prefsData ?? []).forEach((pref: any) => {
        emojiMap.set(pref.match_id, pref.emoji ?? null);
        lastReadMap.set(pref.match_id, pref.last_read_at ?? null);
        if (pref.hidden_at) hiddenMatchIds.add(pref.match_id);
      });

      function buildCard(m: MatchRow, isArchived: boolean): MatchCard {
        const otherUserId = m.user_a === uid ? m.user_b : m.user_a;
        const otherProfile = profileMap.get(otherUserId);

        const lastIncomingAt = latestIncomingAtMap.get(m.id) ?? null;
        const lastReadAt = lastReadMap.get(m.id) ?? null;
        const unread =
          !!lastIncomingAt && (!lastReadAt || new Date(lastIncomingAt) > new Date(lastReadAt));

        // Compat star: only relevant if the viewer has priorities set.
        // Compute score from viewer's perspective only — the other person's
        // priorities don't matter here, because the star is a signal FOR
        // the viewer, not a mutual one.
        let isHighCompat = false;
        if (
          viewerHasPriorities &&
          hasScores(ownProfile?.personality_scores) &&
          hasScores(otherProfile?.personality_scores)
        ) {
          const result = compatibility(
            ownProfile.personality_scores as number[],
            otherProfile!.personality_scores as number[],
            { prioritySliders: viewerPriorities }
          );
          isHighCompat = result !== null && result.score >= 85;
        }

        return {
          id: m.id,
          match_label: m.match_label,
          ageRelationKey: (() => {
            const myBY = profileBirthYear(myProfile);
            const otherBY = profileBirthYear(otherProfile);
            return myBY && otherBY ? getRelativeAgeLabel(myBY, otherBY) : null;
          })(),
          languages: otherProfile?.languages ?? [],
          lastMessage: latestMessageMap.get(m.id) ?? null,
          lastMessageAt: latestMessageAtMap.get(m.id) ?? null,
          unread,
          emoji: emojiMap.get(m.id) ?? null,
          isHighCompat,
          isArchived,
        };
      }

      const cards: MatchCard[] = myMatches.map((m) => buildCard(m, false));
      cards.sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });

      const archived: MatchCard[] = myArchivedMatches
        .filter((m) => !hiddenMatchIds.has(m.id) && latestMessageMap.has(m.id))
        .map((m) => buildCard(m, true));
      archived.sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });

      setMatches(cards);
      setArchivedMatches(archived);
      setLoading(false);
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>{t("common.loading")}</p>
      </main>
    );
  }

  // Unstarted = no messages yet. Surfaced as anonymous tiles up top so the
  // user picks one without any signal about who's behind it.
  const unstarted = matches
    .filter((m) => m.lastMessage === null)
    .sort((a, b) => b.id - a.id);

  // Running = has at least one message. Cards stay as before.
  const running = matches.filter((m) => m.lastMessage !== null);

  return (
    <main className="min-h-screen px-5 pt-6 pb-24">
      <h1 className="text-xl font-bold mb-6 text-[#1C1410]">{t("matches.heading")}</h1>

      {unstarted.length === 0 && running.length === 0 ? (
        <div className="space-y-2">
          <p className="text-[#6B5A52]">{t("matches.empty_title")}</p>
          <p className="text-sm text-[#A89488]">{t("matches.empty_body")}</p>
        </div>
      ) : (
        <>
          {/* Unstarted matches — single horizontal scroll row */}
          {unstarted.length > 0 && (
            <div className="-mx-5 mb-6">
              <div className="flex gap-3 overflow-x-auto px-5 pb-2" style={{ scrollbarWidth: "none" }}>
                {unstarted.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => router.push(`/chat/${m.id}`)}
                    aria-label={t("matches.start_aria")}
                    className="relative flex-shrink-0 w-20 aspect-square rounded-2xl bg-[#FDE8EF] border border-[#F5C9D8] active:scale-95 transition overflow-hidden"
                  >
                    {/* Emoji if set */}
                    {m.emoji && (
                      <span className="absolute inset-0 flex items-center justify-center text-2xl">
                        {m.emoji}
                      </span>
                    )}
                    {/* High-compat star — only for viewers with priorities */}
                    {m.isHighCompat && (
                      <span className="absolute top-1.5 right-1.5 text-sm leading-none text-[#E0175C]">
                        ✦
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Running conversations */}
          {running.length > 0 && (
            <div className="space-y-3">
              {running.map((m) => (
                <div
                  key={m.id}
                  className="bg-white border border-[#EDE3DA] rounded-2xl px-5 py-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      onClick={() => router.push(`/chat/${m.id}`)}
                      className="flex-1 space-y-0.5 cursor-pointer active:scale-[0.98] transition min-w-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-base font-bold text-[#1C1410] truncate">{m.match_label}</div>
                        {m.unread && <div className="h-2 w-2 rounded-full bg-[#E0175C] shrink-0" />}
                      </div>
                      {m.languages.length > 0 && (
                        <div className="text-sm text-[#A89488]">
                          {m.languages.map((l) => t(`language_name.${l}`)).join(", ")}
                        </div>
                      )}
                      <div className="text-sm text-[#6B5A52] pt-1 truncate">
                        {m.lastMessage}
                      </div>
                    </div>

                    <div className="relative pl-3 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenEmojiFor((prev) => (prev === m.id ? null : m.id))
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF3EE] text-xl leading-none"
                      >
                        {m.emoji ?? "＋"}
                      </button>

                      {openEmojiFor === m.id && (
                        <div className="absolute right-0 top-12 z-20 w-64 rounded-2xl bg-white shadow-lg border border-[#EDE3DA] p-3 max-h-72 overflow-y-auto">
                          {EMOJI_GROUPS.map((group) => (
                            <div key={group.label} className="mb-2">
                              <p className="text-[10px] font-semibold text-[#A89488] uppercase tracking-wider mb-1 px-1">{group.label}</p>
                              <div className="grid grid-cols-6 gap-0.5">
                                {group.emojis.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => saveEmoji(m.id, emoji)}
                                    className="flex items-center justify-center h-9 w-9 rounded-xl text-xl active:bg-[#FAF3EE] transition"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          <div className="border-t border-[#EDE3DA] mt-1 pt-2">
                            <button
                              type="button"
                              onClick={() => saveEmoji(m.id, null)}
                              className="w-full py-1.5 text-xs text-[#E0175C] active:bg-[#FAF3EE] rounded-xl transition"
                            >
                              {t("matches.clear_emoji")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Archived / past conversations */}
      {archivedMatches.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-[#A89488] mb-3"
          >
            <span>{t("matches.archived_section")}</span>
            <span className="bg-[#EDE3DA] text-[#6B5A52] text-xs rounded-full px-2 py-0.5">{archivedMatches.length}</span>
            <span className="ml-auto text-xs">{showArchived ? "▲" : "▼"}</span>
          </button>

          {showArchived && (
            <div className="space-y-3">
              {archivedMatches.map((m) => (
                <div
                  key={m.id}
                  className="bg-[#F5F0EC] border border-[#EDE3DA] rounded-2xl px-5 py-4 opacity-70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      onClick={() => router.push(`/chat/${m.id}`)}
                      className="flex-1 space-y-0.5 cursor-pointer min-w-0"
                    >
                      <div className="text-base font-bold text-[#6B5A52] truncate">{m.match_label}</div>
                      {m.languages.length > 0 && (
                        <div className="text-sm text-[#A89488]">
                          {m.languages.map((l) => t(`language_name.${l}`)).join(", ")}
                        </div>
                      )}
                      <div className="text-sm text-[#A89488] pt-1 truncate">{m.lastMessage}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => hideArchivedMatch(m.id)}
                      className="shrink-0 px-3 py-1.5 rounded-full border border-[#EDE3DA] text-xs text-[#A89488] hover:text-red-400 hover:border-red-300 transition"
                    >
                      {t("matches.archived_delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}