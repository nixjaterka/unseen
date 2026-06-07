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
      pathname === path ? "text-[#E0175C]" : "text-neutral-500"
    }`;
  }

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white flex items-center h-16 px-4 border-t border-[#EDE3DA] z-30">
      
      {/* HOME */}
      <button
        onClick={() => router.push("/app")}
        className={itemClass("/app")}
      >
        {t("nav.home")}
      </button>

      {/* MATCHES */}
      <button
        onClick={() => hasApprovedPhoto && router.push("/matches")}
        disabled={!hasApprovedPhoto}
        className={`flex-1 text-center ${
          !hasApprovedPhoto
            ? "text-neutral-300 cursor-not-allowed"
            : pathname === "/matches"
            ? "text-[#E0175C]"
            : "text-neutral-500"
        }`}
      >
        <div className="relative flex items-center justify-center">
          <span>{t("nav.matches")}</span>
          {hasApprovedPhoto && hasUnreadMatches && (
            <span className="absolute -right-2 -top-1 h-2.5 w-2.5 rounded-full bg-[#E0175C]" />
          )}
        </div>
      </button>

      {/* SWIPE (CENTER LOGO) */}
      <button
        onClick={() => hasApprovedPhoto && router.push("/swipe")}
        disabled={!hasApprovedPhoto}
        className="flex-1 flex justify-center"
      >
        <img
          src="/brand/icononly_transparent_nobuffer.png"
          alt="Unseen"
          className={`h-8 w-auto ${!hasApprovedPhoto ? "opacity-25 grayscale" : ""}`}
        />
      </button>

      {/* PROFILE */}
      <button
        onClick={() => router.push("/profile")}
        className={itemClass("/profile")}
      >
        {t("nav.profile")}
      </button>

      {/* SETTINGS */}
      <button
        onClick={() => router.push("/settings")}
        className={itemClass("/settings")}
      >
        {t("nav.settings")}
      </button>
    </div>
  );
}