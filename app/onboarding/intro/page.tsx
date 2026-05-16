"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import { useT } from "../../../lib/i18n/I18nProvider";

// Tracking key — once set, the user has seen the intro at least once on
// this device and we don't push them through it again.
export const INTRO_SEEN_KEY = "unseen.intro_seen";

export default function OnboardingIntroPage() {
  const router = useRouter();
  const t = useT();

  const [checking, setChecking] = useState(true);

  // Auth + onboarding gate. Same shape the rest of the app uses.
  useEffect(() => {
    let cancelled = false;

    async function decide(session: Session | null) {
      if (cancelled) return;

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (profile?.onboarded_at) {
        router.replace("/app");
        return;
      }

      setChecking(false);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "INITIAL_SESSION") decide(session);
      if (event === "SIGNED_OUT") router.replace("/login");
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  function gotIt() {
    try {
      localStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      // ignore — worst case we show the intro again next time
    }
    router.replace("/onboarding");
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">{t("common.loading")}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 flex flex-col">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <img
          src="/brand/fulllogo_transparent_nobuffer.png"
          alt="Unseen"
          className="h-24 w-auto object-contain mb-12 mx-auto"
        />

        <div className="space-y-10">
          <Principle title={t("intro.principle1_title")} body={t("intro.principle1_body")} />
          <Principle title={t("intro.principle2_title")} body={t("intro.principle2_body")} />
          <Principle title={t("intro.principle3_title")} body={t("intro.principle3_body")} />
        </div>
      </div>

      <div className="w-full max-w-md mx-auto pb-4 pt-10">
        <button
          onClick={gotIt}
          className="w-full py-4 rounded-full bg-[#E0175C] text-white font-medium"
        >
          {t("intro.cta")}
        </button>
      </div>
    </main>
  );
}

function Principle({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-bold text-black">{title}</h2>
      <p className="text-neutral-600">{body}</p>
    </div>
  );
}
