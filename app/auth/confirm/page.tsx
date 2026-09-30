"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import { useT } from "../../../lib/i18n/I18nProvider";

// Email links (password reset, email confirmation) land here.
//
// Why a button instead of verifying straight away: corporate mail systems
// (Outlook "Safe Links", security scanners) OPEN every link in an email before
// the person does. These links are one-time — if we verified on page load, the
// scanner would use it up and the person would see "link expired". Scanners
// don't click buttons, so the link is only used when the person taps Continue.
//
// Uses token_hash (not the PKCE "code"), so it works in ANY browser — not only
// the one where the email was requested.
//
// Templates: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
//            {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding/intro

const ALLOWED_NEXT = ["/app", "/reset-password", "/onboarding/intro", "/onboarding"];

export default function ConfirmPage() {
  const router = useRouter();
  const t = useT();
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [type, setType] = useState<EmailOtpType | null>(null);
  const [next, setNext] = useState("/app");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const ty = q.get("type") as EmailOtpType | null;
    setTokenHash(q.get("token_hash"));
    setType(ty);
    const raw = q.get("next") ?? (ty === "recovery" ? "/reset-password" : "/app");
    setNext(ALLOWED_NEXT.includes(raw) ? raw : "/app");
  }, []);

  const isRecovery = type === "recovery";

  async function onContinue() {
    if (!tokenHash || !type) { setFailed(true); return; }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      console.error("[auth/confirm] verifyOtp failed:", error.message);
      setBusy(false);
      setFailed(true);
      return;
    }
    router.replace(next);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[#F8F2ED]">
      <div className="w-full max-w-sm flex flex-col items-center gap-5 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/icononly_transparent_nobuffer.png" alt="" width={72} height={54} />
        {failed ? (
          <>
            <h1 className="text-2xl font-bold text-[#1C1410]">{t("confirm.failed_heading")}</h1>
            <p className="text-sm text-[#6B5A52] leading-relaxed">{t("confirm.failed_body")}</p>
            <button
              onClick={() => router.push(isRecovery ? "/forgot-password" : "/login")}
              className="w-full py-4 rounded-full bg-[#F01860] text-white font-bold"
            >
              {isRecovery ? t("confirm.new_link") : t("forgot.back_to_login")}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[#1C1410]">
              {isRecovery ? t("confirm.recovery_heading") : t("confirm.email_heading")}
            </h1>
            <p className="text-sm text-[#6B5A52] leading-relaxed">
              {isRecovery ? t("confirm.recovery_body") : t("confirm.email_body")}
            </p>
            <button
              onClick={onContinue}
              disabled={busy || !tokenHash}
              className="w-full py-4 rounded-full bg-[#F01860] text-white font-bold disabled:opacity-50"
            >
              {busy ? "…" : t("confirm.continue")}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
