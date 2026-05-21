"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import BottomNav from "../components/BottomNav";
import { useT, useLocale } from "../../lib/i18n/I18nProvider";
import { toCzechVocative } from "../../lib/vocative";
import OnboardingModal from "../components/OnboardingModal";

type SessionUser = { email: string | null };

type ProfileRow = {
  user_id: string;
  birth_year: number | null;
  gender: string | null;
  languages: string[] | null;
  preferred_gender: string | null;
  preferred_age_relations: string[] | null;
};

type PhotoRow = {
  user_id: string;
};

type MatchRow = {
  id: number;
  user_a: string;
  user_b: string;
  chat_unlock_at: string;
  created_at: string;
  unmatched_at: string | null;
  match_label: string;
};

type MessageRow = {
  match_id: number;
  sender_id: string;
  created_at: string;
  content: string;
};

type ConversationPreview = {
  matchId: number;
  label: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
};

type MatchPreferenceRow = {
  match_id: number;
  last_read_at: string | null;
};

type DashboardStats = {
  activeForYou: number;
  likedYou: number;
  unreadConversations: number;
  unlockedMatches: number;
};

function getRelativeAgeLabel(viewerBirthYear: number, otherBirthYear: number) {
  const viewerAge = new Date().getFullYear() - viewerBirthYear;
  const diff = otherBirthYear - viewerBirthYear;
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
  }

  if (absDiff <= bit) return "a bit older than you";
  if (absDiff <= older) return "older than you";
  return "much older than you";
}

const EQUIVALENT_LANGUAGE_GROUPS = [["czech", "slovak"]];

function hasSharedLanguage(a: string[] | null, b: string[] | null) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  const aLower = a.map((x) => x.toLowerCase());
  const bLower = b.map((x) => x.toLowerCase());
  const setA = new Set(aLower);
  if (bLower.some((l) => setA.has(l))) return true;
  return aLower.some((al) =>
    bLower.some((bl) =>
      EQUIVALENT_LANGUAGE_GROUPS.some((g) => g.includes(al) && g.includes(bl))
    )
  );
}

function getActiveForYouKey(count: number): string {
  if (count === 0) return "dashboard.active.0";
  if (count <= 5) return "dashboard.active.few";
  if (count <= 20) return "dashboard.active.handful";
  return "dashboard.active.plenty";
}

function getLikedYouKey(count: number, accountAgeDays: number | null): string {
  if (count === 0) {
    if (accountAgeDays !== null && accountAgeDays >= 7) {
      return "dashboard.liked.quiet_old";
    }
    return "dashboard.liked.quiet_new";
  }

  if (count <= 3) return "dashboard.liked.few";
  return "dashboard.liked.many";
}

function resetSupabaseClientState() {
  // Clears Supabase auth remnants that can cause “ghost sessions” in Chrome.
  try {
    // localStorage keys often start with: sb-<project-ref>-auth-token
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-")) localStorage.removeItem(k);
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("sb-")) sessionStorage.removeItem(k);
    }
  } catch {
    // ignore (private mode etc.)
  }
}

export default function AppHome() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();

  const [loading, setLoading] = useState(true);
  const [status] = useState<string>("Checking session…");
  const [uid, setUid] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [hasApprovedPhoto, setHasApprovedPhoto] = useState<boolean | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    activeForYou: 0,
    likedYou: 0,
    unreadConversations: 0,
    unlockedMatches: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [accountAgeDays, setAccountAgeDays] = useState<number | null>(null);
  const [openInfo, setOpenInfo] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  async function loadDashboardStats(uid: string) {
    setStatsLoading(true);

    const nowIso = new Date().toISOString();

    // Fire the heavy API call and the local matches query in parallel.
    // activeForYou + likedYou come from the API; unread + unlocked come locally.
    const [dashboardRes, matchesResult] = await Promise.all([
      fetch("/api/swipe/next?mode=dashboard", { credentials: "include" }),
      supabase
        .from("matches")
        .select("id, user_a, user_b, chat_unlock_at, unmatched_at, match_label")
        .lte("chat_unlock_at", nowIso)
        .is("unmatched_at", null),
    ]);

    let activeForYou = 0;
    let likedYou = 0;
    try {
      const dashboardJson = await dashboardRes.json();
      if (typeof dashboardJson?.stats?.activeForYou === "number") activeForYou = dashboardJson.stats.activeForYou;
      if (typeof dashboardJson?.stats?.likedYou === "number") likedYou = dashboardJson.stats.likedYou;
    } catch {
      // API failed — stats stay 0, not a crash
    }

    const myMatches = ((matchesResult.data as MatchRow[] | null) ?? []).filter(
      (m) => m.user_a === uid || m.user_b === uid
    );
    const unlockedMatches = myMatches.length;
    const matchIds = myMatches.map((m) => m.id);

    let unreadConversations = 0;

    if (matchIds.length > 0) {
      // Messages + preferences in parallel
      const [messagesResult, prefsResult] = await Promise.all([
        supabase
          .from("messages")
          .select("match_id, sender_id, content, created_at")
          .in("match_id", matchIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("match_preferences")
          .select("match_id, last_read_at")
          .eq("user_id", uid)
          .in("match_id", matchIds),
      ]);

      const latestIncomingAtMap = new Map<number, string>();
      ((messagesResult.data as MessageRow[] | null) ?? []).forEach((msg) => {
        if (msg.sender_id !== uid && !latestIncomingAtMap.has(msg.match_id)) {
          latestIncomingAtMap.set(msg.match_id, msg.created_at);
        }
      });

      const lastReadMap = new Map<number, string | null>();
      ((prefsResult.data as MatchPreferenceRow[] | null) ?? []).forEach((pref) => {
        lastReadMap.set(pref.match_id, pref.last_read_at ?? null);
      });

      unreadConversations = matchIds.filter((id) => {
        const lastIncomingAt = latestIncomingAtMap.get(id);
        const lastReadAt = lastReadMap.get(id) ?? null;
        return !!lastIncomingAt && (!lastReadAt || new Date(lastIncomingAt) > new Date(lastReadAt));
      }).length;

      // Build conversation previews — only matches that have at least one message
      const latestMessageMap = new Map<number, { content: string; at: string; fromMe: boolean }>();
      ((messagesResult.data as MessageRow[] | null) ?? []).forEach((msg) => {
        if (!latestMessageMap.has(msg.match_id)) {
          latestMessageMap.set(msg.match_id, {
            content: msg.content,
            at: msg.created_at,
            fromMe: msg.sender_id === uid,
          });
        }
      });

      const previews: ConversationPreview[] = myMatches
        .filter((m) => latestMessageMap.has(m.id))
        .map((m) => {
          const msg = latestMessageMap.get(m.id)!;
          const lastIncomingAt = latestIncomingAtMap.get(m.id);
          const lastReadAt = lastReadMap.get(m.id) ?? null;
          const unread = !!lastIncomingAt && (!lastReadAt || new Date(lastIncomingAt) > new Date(lastReadAt));
          return {
            matchId: m.id,
            label: m.match_label,
            lastMessage: msg.fromMe ? `${t("dashboard.you_prefix")}${msg.content}` : msg.content,
            lastMessageAt: msg.at,
            unread,
          };
        })
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

      setConversations(previews);
    }

    setStats({ activeForYou, likedYou, unreadConversations, unlockedMatches });
    setStatsLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function decide(session: any | null) {
      if (cancelled) return;
  
      if (!session) {
        router.replace("/login");
        return;
      }
  
      // Gating query — only the columns that are guaranteed to exist
      const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarded_at, deleted_at")
      .eq("user_id", session.user.id)
      .maybeSingle();

      if (cancelled) return;

      if (profile?.deleted_at) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      if (error || !profile?.onboarded_at) {
        router.replace("/onboarding");
        return;
      }

      setUid(session.user.id);
      setUser({ email: session.user.email ?? null });

      // Non-blocking: check whether the user has at least one approved photo.
      void supabase
        .from("photos")
        .select("id", { count: "exact", head: true })
        .eq("moderation_status", "approved")
        .then(({ count }) => {
          if (!cancelled) setHasApprovedPhoto((count ?? 0) > 0);
        });

      // Non-blocking: fetch first_name separately so a missing column
      // (migration not yet applied) never breaks the gate check above.
      void supabase
        .from("profiles")
        .select("first_name")
        .eq("user_id", session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (!cancelled && data?.first_name) setFirstName(data.first_name);
        });

      if (session.user.created_at) {
        const createdAt = new Date(session.user.created_at);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        setAccountAgeDays(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }

      // Show the page shell immediately — stats fill in behind the "…" placeholders
      setLoading(false);
      loadDashboardStats(session.user.id);

      // First-time onboarding — show once per device
      try {
        if (!localStorage.getItem("unseen_onboarding_done")) {
          setShowOnboarding(true);
        }
      } catch { /* private mode */ }
    }
  
    // 🔑 Wait for Supabase to finish restoring auth
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;
  
        if (event === "INITIAL_SESSION") {
          await decide(session);
        }
  
        if (event === "SIGNED_OUT") {
          router.replace("/login");
        }
      }
    );
  
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  // Real-time dashboard refresh — re-runs loadDashboardStats whenever anything
  // relevant changes in the DB (new swipe, match, message, or read receipt).
  useEffect(() => {
    if (!uid) return;

    const reload = () => loadDashboardStats(uid);

    const swipesChannel = supabase
      .channel("dashboard-swipes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "swipes" }, reload)
      .subscribe();

    const matchesChannel = supabase
      .channel("dashboard-matches")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "matches" }, reload)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches" }, reload)
      .subscribe();

    const messagesChannel = supabase
      .channel("dashboard-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, reload)
      .subscribe();

    const prefsChannel = supabase
      .channel("dashboard-prefs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "match_preferences" }, reload)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "match_preferences" }, reload)
      .subscribe();

    return () => {
      supabase.removeChannel(swipesChannel);
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(prefsChannel);
    };
  }, [uid]);

  function recover() {
    resetSupabaseClientState();
    router.replace("/login");
  }

  // Loading screen (but not forever)
  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 px-6">
        <p className="text-neutral-300">{t("common.loading")}</p>
        <p className="text-sm text-neutral-400">{status}</p>
      </main>
    );
  }

  // Recovery screen (when something goes weird)
  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <h1 className="text-xl font-bold">{t("dashboard.brand")}</h1>
        <p className="text-neutral-300">{status}</p>

        <button
          onClick={recover}
          className="px-6 py-3 rounded-full bg-[#FDF3EC] text-black font-medium"
        >
          {t("dashboard.recover_button")}
        </button>
      </main>
    );
  }

    // Normal app view
    return (
      <main className="min-h-screen px-5 pt-8 pb-28 flex flex-col gap-6">
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <img
            src="/brand/icononly_transparent_nobuffer.png"
            alt="Unseen"
            className="h-7 w-auto"
          />
          <h1 className="text-xl font-bold text-[#1C1410]">
            {firstName
              ? t("dashboard.hello").replace(
                  "{name}",
                  locale === "cs" ? toCzechVocative(firstName) : firstName
                )
              : t("dashboard.brand")}
          </h1>
        </div>

        {/* PHOTO APPROVAL BANNER */}
        {hasApprovedPhoto === false && (
          <div className="rounded-2xl bg-[#FFF3CD] border border-[#FFDFA0] px-5 py-4">
            <p className="text-sm font-semibold text-[#5A4500]">{t("dashboard.waiting_photo_heading")}</p>
            <p className="text-xs text-[#7A6000] mt-1">{t("dashboard.waiting_photo_body")}</p>
          </div>
        )}

        {/* STATS */}
        <div className="flex flex-col gap-3" onClick={() => setOpenInfo(null)}>

          {/* Active for you */}
          <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm relative">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-[#A89488] uppercase tracking-wider mb-1">{t("dashboard.stat.active")}</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpenInfo(openInfo === "active" ? null : "active"); }}
                className="text-[#C4B4AA] text-sm leading-none mt-0.5"
              >ⓘ</button>
            </div>
            {openInfo === "active" && (
              <div className="absolute left-4 right-4 top-12 z-10 bg-[#1C1410] text-white text-xs rounded-xl px-3 py-2 shadow-lg">
                {t("dashboard.info.active")}
              </div>
            )}
            <p className="text-4xl font-bold text-[#1C1410]">{statsLoading ? "…" : stats.activeForYou}</p>
            <p className="text-sm text-[#6B5A52] mt-1">
              {statsLoading ? t("dashboard.checking_prefs") : t(getActiveForYouKey(stats.activeForYou))}
            </p>
          </div>

          {/* Liked you */}
          <div className="bg-[#E0175C] rounded-2xl p-5 shadow-sm relative">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">{t("dashboard.stat.liked")}</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpenInfo(openInfo === "liked" ? null : "liked"); }}
                className="text-white/60 text-sm leading-none mt-0.5"
              >ⓘ</button>
            </div>
            {openInfo === "liked" && (
              <div className="absolute left-4 right-4 top-12 z-10 bg-[#1C1410] text-white text-xs rounded-xl px-3 py-2 shadow-lg">
                {t("dashboard.info.liked")}
              </div>
            )}
            <p className="text-4xl font-bold text-white">{statsLoading ? "…" : stats.likedYou}</p>
            <p className="text-sm text-white/80 mt-1">
              {statsLoading ? t("dashboard.checking_interest") : t(getLikedYouKey(stats.likedYou, accountAgeDays))}
            </p>
          </div>

          {/* Unread + Open matches */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <button
                onClick={() => router.push("/matches")}
                className={`w-full rounded-2xl p-5 text-left shadow-sm border transition-colors ${
                  stats.unreadConversations > 0
                    ? "bg-[#FDE8EF] border-[#E0175C]"
                    : "bg-white border-[#EDE3DA]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-xs font-semibold text-[#A89488] uppercase tracking-wider mb-1">{t("dashboard.stat.unread")}</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setOpenInfo(openInfo === "unread" ? null : "unread"); }}
                    className="text-[#C4B4AA] text-sm leading-none mt-0.5"
                  >ⓘ</button>
                </div>
                <p className="text-3xl font-bold text-[#1C1410]">{statsLoading ? "…" : stats.unreadConversations}</p>
              </button>
              {openInfo === "unread" && (
                <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-[#1C1410] text-white text-xs rounded-xl px-3 py-2 shadow-lg">
                  {t("dashboard.info.unread")}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => router.push("/matches")}
                className="w-full bg-white border border-[#EDE3DA] rounded-2xl p-5 text-left shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <p className="text-xs font-semibold text-[#A89488] uppercase tracking-wider mb-1">{t("dashboard.stat.open_matches")}</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setOpenInfo(openInfo === "open" ? null : "open"); }}
                    className="text-[#C4B4AA] text-sm leading-none mt-0.5"
                  >ⓘ</button>
                </div>
                <p className="text-3xl font-bold text-[#1C1410]">{statsLoading ? "…" : stats.unlockedMatches}</p>
              </button>
              {openInfo === "open" && (
                <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-[#1C1410] text-white text-xs rounded-xl px-3 py-2 shadow-lg">
                  {t("dashboard.info.open_matches")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ACTIVE CONVERSATIONS COUNT */}
        <div className="relative">
          <button
            onClick={() => router.push("/matches")}
            className="w-full bg-white border border-[#EDE3DA] rounded-2xl p-5 text-left shadow-sm"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold text-[#A89488] uppercase tracking-wider mb-1">{t("dashboard.active_conversations")}</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpenInfo(openInfo === "convos" ? null : "convos"); }}
                className="text-[#C4B4AA] text-sm leading-none mt-0.5"
              >ⓘ</button>
            </div>
            <p className="text-3xl font-bold text-[#1C1410]">{statsLoading ? "…" : conversations.length}</p>
          </button>
          {openInfo === "convos" && (
            <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-[#1C1410] text-white text-xs rounded-xl px-3 py-2 shadow-lg">
              {t("dashboard.info.active_conversations")}
            </div>
          )}
        </div>

        <BottomNav />

        {showOnboarding && (
          <OnboardingModal
            steps={[
              { emoji: t("onboarding.s1.emoji"), title: t("onboarding.s1.title"), body: t("onboarding.s1.body") },
              { emoji: t("onboarding.s2.emoji"), title: t("onboarding.s2.title"), body: t("onboarding.s2.body") },
              { emoji: t("onboarding.s3.emoji"), title: t("onboarding.s3.title"), body: t("onboarding.s3.body") },
              { emoji: t("onboarding.s4.emoji"), title: t("onboarding.s4.title"), body: t("onboarding.s4.body") },
              { emoji: t("onboarding.s5.emoji"), title: t("onboarding.s5.title"), body: t("onboarding.s5.body") },
            ]}
            ctaLabel={t("onboarding.cta")}
            onDone={() => {
              setShowOnboarding(false);
              try { localStorage.setItem("unseen_onboarding_done", "1"); } catch { /* private mode */ }
            }}
          />
        )}
      </main>
    );
  }