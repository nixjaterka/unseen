"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n/I18nProvider";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();

  const [hasUnreadMatches, setHasUnreadMatches] = useState(false);
  const [hasApprovedPhoto, setHasApprovedPhoto] = useState(true); // optimistic — greyed out only once confirmed

  useEffect(() => {
    let isMounted = true;

    async function loadUnreadState() {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;

      if (!uid) {
        if (isMounted) setHasUnreadMatches(false);
        return;
      }

      // Check approved photo in parallel with unread state.
      void supabase
        .from("photos")
        .select("id", { count: "exact", head: true })
        .eq("moderation_status", "approved")
        .then(({ count }) => {
          if (isMounted) setHasApprovedPhoto((count ?? 0) > 0);
        });

      const nowIso = new Date().toISOString();

      const { data: matchesData } = await supabase
        .from("matches")
        .select("id, user_a, user_b, chat_unlock_at, unmatched_at")
        .lte("chat_unlock_at", nowIso)
        .is("unmatched_at", null);

      const myMatches = (matchesData ?? []).filter(
        (m: any) => m.user_a === uid || m.user_b === uid
      );

      const matchIds = myMatches.map((m: any) => m.id);

      if (matchIds.length === 0) {
        if (isMounted) setHasUnreadMatches(false);
        return;
      }

      const { data: messagesData } = await supabase
        .from("messages")
        .select("match_id, sender_id, created_at")
        .in("match_id", matchIds)
        .order("created_at", { ascending: false });

      const { data: prefsData } = await supabase
        .from("match_preferences")
        .select("match_id, last_read_at")
        .eq("user_id", uid)
        .in("match_id", matchIds);

      const latestIncomingAtMap = new Map<number, string>();
      (messagesData ?? []).forEach((msg: any) => {
        if (msg.sender_id !== uid && !latestIncomingAtMap.has(msg.match_id)) {
          latestIncomingAtMap.set(msg.match_id, msg.created_at);
        }
      });

      const lastReadMap = new Map<number, string | null>();
      (prefsData ?? []).forEach((pref: any) => {
        lastReadMap.set(pref.match_id, pref.last_read_at ?? null);
      });

      const unreadExists = matchIds.some((id: number) => {
        const lastIncomingAt = latestIncomingAtMap.get(id);
        const lastReadAt = lastReadMap.get(id) ?? null;
        return !!lastIncomingAt && (!lastReadAt || new Date(lastIncomingAt) > new Date(lastReadAt));
      });

      if (isMounted) setHasUnreadMatches(unreadExists);
    }

    loadUnreadState();

    const messagesChannel = supabase
      .channel("bottom-nav-unread-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          loadUnreadState();
        }
      )
      .subscribe();

    const prefsChannel = supabase
      .channel("bottom-nav-unread-prefs")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "match_preferences" },
        () => {
          loadUnreadState();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "match_preferences" },
        () => {
          loadUnreadState();
        }
      )
      .subscribe();

    const matchesChannel = supabase
      .channel("bottom-nav-unread-matches")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        () => {
          loadUnreadState();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matches" },
        () => {
          loadUnreadState();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(prefsChannel);
      supabase.removeChannel(matchesChannel);
    };
  }, []);

  function itemClass(path: string) {
    return `flex-1 text-center ${
      pathname === path ? "text-[#F01860]" : "text-neutral-500"
    }`;
  }

  const iconColor = (path: string) =>
    pathname === path ? "text-[#F01860]" : "text-neutral-400";

  const labelColor = (path: string) =>
    pathname === path ? "text-[#F01860]" : "text-neutral-400";

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white flex items-end justify-around pb-3 pt-2 border-t border-[#EDE3DA] z-30">

      {/* HOME */}
      <button onClick={() => router.push("/app")} className={`flex flex-col items-center gap-1 flex-1 ${iconColor("/app")}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${labelColor("/app")}`}>{t("nav.home")}</span>
      </button>

      {/* MATCHES */}
      <button
        onClick={() => hasApprovedPhoto && router.push("/matches")}
        disabled={!hasApprovedPhoto}
        className={`flex flex-col items-center gap-1 flex-1 relative ${
          !hasApprovedPhoto ? "text-neutral-300 cursor-not-allowed" : iconColor("/matches")
        }`}
      >
        <div className="relative">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {hasApprovedPhoto && hasUnreadMatches && (
            <span className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-[#F01860]" />
          )}
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${labelColor("/matches")}`}>{t("nav.matches")}</span>
      </button>

      {/* SWIPE (CENTER LOGO) */}
      <button
        onClick={() => hasApprovedPhoto && router.push("/swipe")}
        disabled={!hasApprovedPhoto}
        className="flex flex-col items-center flex-1 -mt-5"
      >
        <img
          src="/brand/icononly_transparent_nobuffer.png"
          alt="Unseen"
          className={`h-8 w-auto ${!hasApprovedPhoto ? "opacity-25 grayscale" : ""}`}
        />
      </button>

      {/* PROFILE */}
      <button onClick={() => router.push("/profile")} className={`flex flex-col items-center gap-1 flex-1 ${iconColor("/profile")}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${labelColor("/profile")}`}>{t("nav.profile")}</span>
      </button>

      {/* SETTINGS */}
      <button onClick={() => router.push("/settings")} className={`flex flex-col items-center gap-1 flex-1 ${iconColor("/settings")}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${labelColor("/settings")}`}>{t("nav.settings")}</span>
      </button>
    </div>
  );
}