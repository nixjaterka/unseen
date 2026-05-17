"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n/I18nProvider";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const t = useT();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setErrorMsg(null);

    // Route through /auth/callback so the PKCE code is properly exchanged
    // before the user lands on /reset-password.
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
      // Show the generic success state regardless.
      setSent(true);
      return;
    }

    setSent(true);
  }

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

        {sent ? (
          <p className="text-sm text-[#6B5A52] text-center leading-relaxed">{t("forgot.sent")}</p>
        ) : (
          <>
            <p className="text-sm text-[#6B5A52] text-center">{t("forgot.intro")}</p>

            <input
              className="border border-[#EDE3DA] bg-white px-4 py-3.5 rounded-2xl w-full text-base text-[#1C1410] placeholder:text-[#A89488] focus:outline-none focus:border-[#E0175C] transition-colors"
              placeholder={t("login.email_placeholder")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
        )}

        <button
          onClick={() => router.push("/login")}
          className="w-full py-4 rounded-full border-2 border-[#EDE3DA] text-[#6B5A52] font-bold"
        >
          {t("forgot.back_to_login")}
        </button>
      </div>
    </main>
  );
}
