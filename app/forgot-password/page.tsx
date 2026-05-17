"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useT, useLocale } from "../../lib/i18n/I18nProvider";
import { LOCALES, LOCALE_LABELS, type Locale } from "../../lib/i18n";

const COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const t = useT();
  const { locale, setLocale } = useLocale();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0); // seconds remaining
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [cooldown]);

  async function submit() {
    if (cooldown > 0) return;
    setLoading(true);
    setErrorMsg(null);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=/reset-password`
        : "/auth/callback?next=/reset-password";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      // Don't surface "user not found" — that would leak account existence.
    }

    setSent(true);
    setCooldown(COOLDOWN_SECONDS);
  }

  const resendLabel = cooldown > 0
    ? t("forgot.resend_wait").replace("{{seconds}}", String(cooldown))
    : t("forgot.resend");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full flex flex-col gap-5">
        <div className="flex justify-center mb-2">
          <button type="button" onClick={() => router.push("/")}>
            <img
              src="/brand/fulllogo_transparent_nobuffer.png"
              alt="Unseen"
              className="h-16 w-auto object-contain"
            />
          </button>
        </div>

        <h1 className="text-2xl font-bold text-center text-[#1C1410]">{t("forgot.heading")}</h1>

        {!sent ? (
          <>
            <p className="text-sm text-[#6B5A52] text-center">{t("forgot.intro")}</p>

            <input
              className="border border-[#EDE3DA] bg-white px-4 py-3.5 rounded-2xl w-full text-base text-[#1C1410] placeholder:text-[#A89488] focus:outline-none focus:border-[#E0175C] transition-colors"
              placeholder={t("login.email_placeholder")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && email) submit(); }}
            />

            {errorMsg ? (
              <p className="text-sm text-red-500 text-center">{errorMsg}</p>
            ) : null}

            <button
              onClick={submit}
              disabled={loading || !email}
              className="w-full py-4 rounded-full bg-[#E0175C] text-white font-bold disabled:opacity-40 transition-opacity"
            >
              {loading ? t("forgot.sending") : t("forgot.submit")}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-[#6B5A52] text-center leading-relaxed">
              {t("forgot.sent")}
            </p>

            {/* Resend button with cooldown */}
            <button
              onClick={submit}
              disabled={loading || cooldown > 0}
              className="w-full py-4 rounded-full border-2 border-[#EDE3DA] text-[#6B5A52] font-bold disabled:opacity-40 transition-opacity"
            >
              {loading ? t("forgot.sending") : resendLabel}
            </button>
          </>
        )}

        <button
          onClick={() => router.push("/login")}
          className="w-full py-4 rounded-full border-2 border-[#EDE3DA] text-[#6B5A52] font-bold"
        >
          {t("forgot.back_to_login")}
        </button>

        {/* Language toggle */}
        <div className="flex justify-center gap-1 pt-2">
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code as Locale)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                locale === code
                  ? "bg-[#E0175C] text-white"
                  : "text-[#A89488] hover:text-[#E0175C]"
              }`}
            >
              {LOCALE_LABELS[code as Locale]}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
