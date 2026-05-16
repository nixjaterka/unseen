"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useT, useLocale } from "../lib/i18n/I18nProvider";
import type { Locale } from "../lib/i18n";

const STEPS = [
  { num: "01", titleKey: "landing.step1_title", bodyKey: "landing.step1_body" },
  { num: "02", titleKey: "landing.step2_title", bodyKey: "landing.step2_body" },
  { num: "03", titleKey: "landing.step3_title", bodyKey: "landing.step3_body" },
] as const;

export default function LandingPage() {
  const router = useRouter();
  const t = useT();
  const { locale, setLocale } = useLocale();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function decide(session: Session | null) {
      if (cancelled) return;

      if (!session) {
        setChecking(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

      router.replace(profile?.onboarded_at ? "/app" : "/onboarding");
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "INITIAL_SESSION") decide(session);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  const LangToggle = () => (
    <div className="flex justify-end px-4 pt-4">
      <div className="flex gap-1 bg-white/80 backdrop-blur-sm border border-[#EDE3DA] rounded-full px-1 py-1 shadow-sm">
        {(["en", "cs"] as Locale[]).map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              locale === l
                ? "bg-[#E0175C] text-white"
                : "text-[#6B5A52] hover:text-[#1C1410]"
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );

  if (checking) {
    return (
      <main className="min-h-screen flex flex-col bg-[#FAF3EE]">
        <LangToggle />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-[#E0175C] border-t-transparent animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF3EE] flex flex-col">
      <LangToggle />

      {/* ── HERO ── */}
      <section className="flex flex-col items-center justify-center px-6 pt-8 pb-6 text-center min-h-[92dvh]">

        {/* Logo */}
        <img
          src="/brand/fulllogo_transparent_nobuffer.png"
          alt="Unseen"
          className="h-14 w-auto object-contain mb-12"
        />

        {/* Headline */}
        <h1 className="text-[2.1rem] leading-[1.2] font-bold text-[#1C1410] max-w-xs whitespace-pre-line">
          {t("landing.hero_heading")}
        </h1>

        <p className="mt-4 text-base text-[#6B5A52] max-w-[260px] leading-relaxed">
          {t("landing.hero_sub")}
        </p>

        {/* CTAs */}
        <div className="mt-10 w-full max-w-sm flex flex-col gap-3">
          <button
            onClick={() => router.push("/signup")}
            className="w-full py-4 rounded-full bg-[#E0175C] text-white font-bold text-base shadow-sm active:scale-[0.98] transition-transform"
          >
            {t("landing.cta_create_account")}
          </button>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-4 rounded-full border-2 border-[#EDE3DA] text-[#6B5A52] font-bold text-base active:scale-[0.98] transition-transform"
          >
            {t("landing.cta_log_in")}
          </button>
        </div>

        {/* Scroll hint */}
        <div className="mt-8 flex flex-col items-center gap-2 opacity-35">
          <span className="text-[10px] text-[#1C1410] tracking-[0.2em] uppercase">How it works</span>
          <div className="w-px h-8 bg-[#1C1410]" />
        </div>
      </section>

      {/* ── THREE STEPS ── */}
      <section className="px-5 py-12 flex flex-col gap-4 max-w-lg mx-auto w-full">
        {STEPS.map((step) => (
          <div
            key={step.num}
            className="bg-white border border-[#EDE3DA] rounded-3xl p-6 shadow-sm flex gap-5 items-start"
          >
            <span className="text-3xl font-bold text-[#E0175C] leading-none mt-0.5 select-none tabular-nums shrink-0">
              {step.num}
            </span>
            <div>
              <h2 className="text-base font-bold text-[#1C1410] leading-snug mb-1.5">
                {t(step.titleKey)}
              </h2>
              <p className="text-sm text-[#6B5A52] leading-relaxed">
                {t(step.bodyKey)}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ── PHILOSOPHY ── */}
      <section className="px-8 py-10 text-center max-w-sm mx-auto w-full">
        <span className="text-2xl text-[#E0175C] select-none leading-none">✦</span>
        <p className="mt-4 text-[#1C1410] font-medium text-base leading-relaxed">
          {t("landing.philosophy")}
        </p>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-6 pt-2 pb-16 flex flex-col items-center gap-5 max-w-sm mx-auto w-full">
        <p className="text-sm text-[#A89488] text-center">
          {t("landing.final_cta_heading")}
        </p>
        <button
          onClick={() => router.push("/signup")}
          className="w-full py-4 rounded-full bg-[#E0175C] text-white font-bold text-base shadow-sm active:scale-[0.98] transition-transform"
        >
          {t("landing.cta_create_account")}
        </button>
        <button
          onClick={() => router.push("/login")}
          className="text-sm text-[#A89488] hover:text-[#E0175C] transition-colors"
        >
          {t("landing.cta_log_in")}
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 pb-8 text-center">
        <p className="text-xs text-[#A89488]">
          © {new Date().getFullYear()} Unseen · unseenapp.cz
        </p>
      </footer>

    </main>
  );
}
