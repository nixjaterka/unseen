"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import BottomNav from "../components/BottomNav";
import { useT } from "../../lib/i18n/I18nProvider";

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
};

type MessageRow = {
  match_id: number;
  sender_id: string;
  created_at: string;
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

function hasSharedLanguage(a: string[] | null, b: string[] | null) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  const setA = new Set(a.map((x) => x.toLowerCase()));
  return b.some((lang) => setA.has(lang.toLowerCase()));
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

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("Checking session…");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    activeForYou: 0,
    likedYou: 0,
    unreadConversations: 0,
    unlockedMatches: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [accountAgeDays, setAccountAgeDays] = useState<number | null>(null);

  const didFinish = useRef(false);

  async function loadDashboardStats(uid: string) {
    setStatsLoading(true);

    const nowIso = new Date().toISOString();

    // Fire the heavy API call and the local matches query in parallel.
    // activeForYou + likedYou come from the API; unread + unlocked come locally.
    const [dashboardRes, matchesResult] = await Promise.all([
      fetch("/api/swipe/next?mode=dashboard", { credentials: "include" }),
      supabase
        .from("matches")
        .select("id, user_a, user_b, chat_unlock_at, unmatched_at")
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
          .select("match_id, sender_id, created_at")
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
    }

    setStats({ activeForYou, likedYou, unreadConversations, unlockedMatches });
    setStatsLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    let initialized = false;
  
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

      setUser({ email: session.user.email ?? null });

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
    }
  
    // 🔑 Wait for Supabase to finish restoring auth
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;
  
        if (event === "INITIAL_SESSION") {
          initialized = true;
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
              ? t("dashboard.hello").replace("{name}", firstName)
              : t("dashboard.brand")}
          </h1>
        </div>

        {/* STATS */}
        <div className="flex flex-col gap-3">
          {/* Active for you */}
          <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-[#A89488] uppercase tracking-wider mb-1">{t("dashboard.stat.active")}</p>
            <p className="text-4xl font-bold text-[#1C1410]">{statsLoading ? "…" : stats.activeForYou}</p>
            <p className="text-sm text-[#6B5A52] mt-1">
              {statsLoading ? t("dashboard.checking_prefs") : t(getActiveForYouKey(stats.activeForYou))}
            </p>
          </div>

          {/* Liked you */}
          <div className="bg-[#E0175C] rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">{t("dashboard.stat.liked")}</p>
            <p className="text-4xl font-bold text-white">{statsLoading ? "…" : stats.likedYou}</p>
            <p className="text-sm text-white/80 mt-1">
              {statsLoading ? t("dashboard.checking_interest") : t(getLikedYouKey(stats.likedYou, accountAgeDays))}
            </p>
          </div>

          {/* Unread + Open matches */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push("/matches")}
              className={`rounded-2xl p-5 text-left shadow-sm border transition-colors ${
                stats.unreadConversations > 0
                  ? "bg-[#FDE8EF] border-[#E0175C]"
                  : "bg-white border-[#EDE3DA]"
              }`}
            >
              <p className="text-xs font-semibold text-[#A89488] uppercase tracking-wider mb-1">{t("dashboard.stat.unread")}</p>
              <p className="text-3xl font-bold text-[#1C1410]">{statsLoading ? "…" : stats.unreadConversations}</p>
            </button>

            <button
              onClick={() => router.push("/matches")}
              className="bg-white border border-[#EDE3DA] rounded-2xl p-5 text-left shadow-sm"
            >
              <p className="text-xs font-semibold text-[#A89488] uppercase tracking-wider mb-1">{t("dashboard.stat.open_matches")}</p>
              <p className="text-3xl font-bold text-[#1C1410]">{statsLoading ? "…" : stats.unlockedMatches}</p>
            </button>
          </div>
        </div>

        <BottomNav />
      </main>
    );
  }