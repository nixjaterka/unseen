"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n/I18nProvider";

type Status = "checking" | "ready" | "expired" | "saving" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const t = useT();

  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Wait briefly for Supabase to fire PASSWORD_RECOVERY (it picks up the
  // token from the URL hash and creates a recovery session). If neither
  // PASSWORD_RECOVERY nor an existing session shows up after a beat,
  // the link is expired or invalid.
  useEffect(() => {
    let cancelled = false;
    let resolved = false;

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY") {
        resolved = true;
        setStatus("ready");
      }
      if (event === "INITIAL_SESSION") {
        // If the user already has a session (came in via the recovery link),
        // give a brief grace window for PASSWORD_RECOVERY to follow. If not,
        // we're either in a normal session (uncommon path) or no session.
        setTimeout(() => {
          if (cancelled || resolved) return;
          if (session) {
            // Already in a session somehow — let them set a new password anyway.
            setStatus("ready");
          } else {
            setStatus("expired");
          }
        }, 300);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit() {
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg(t("reset.error_too_short"));
      return;
    }
    if (password !== confirm) {
      setErrorMsg(t("reset.error_mismatch"));
      return;
    }

    setStatus("saving");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg(error.message);
      setStatus("ready");
      return;
    }

    setStatus("done");
    // Slight pause so the user sees the "updating" state resolve, then go in.
    setTimeout(() => router.replace("/app"), 400);
  }

  if (status === "checking") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">{t("reset.checking")}</p>
      </main>
    );
  }

  if (status === "expired") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full flex flex-col gap-5">
          <h1 className="text-2xl font-bold text-center text-[#1C1410]">{t("reset.heading")}</h1>
          <p className="text-sm text-red-500 text-center">{t("reset.error_expired")}</p>
          <button
            onClick={() => router.push("/forgot-password")}
            className="w-full py-4 rounded-full bg-[#E0175C] text-white font-bold"
          >
            {t("reset.request_new")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full flex flex-col gap-5">
        <div className="flex justify-center mb-2">
          <img
            src="/brand/fulllogo_transparent_nobuffer.png"
            alt="Unseen"
            className="h-16 w-auto object-contain"
          />
        </div>

        <h1 className="text-2xl font-bold text-center text-[#1C1410]">{t("reset.heading")}</h1>

        <div className="flex flex-col gap-3">
          <input
            className="border border-[#EDE3DA] bg-white px-4 py-3.5 rounded-2xl w-full text-base text-[#1C1410] placeholder:text-[#A89488] focus:outline-none focus:border-[#E0175C] transition-colors"
            placeholder={t("reset.password_placeholder")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            className="border border-[#EDE3DA] bg-white px-4 py-3.5 rounded-2xl w-full text-base text-[#1C1410] placeholder:text-[#A89488] focus:outline-none focus:border-[#E0175C] transition-colors"
            placeholder={t("reset.confirm_placeholder")}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {errorMsg ? (
          <p className="text-sm text-red-500 text-center">{errorMsg}</p>
        ) : null}

        <button
          onClick={submit}
          disabled={status === "saving" || status === "done" || !password || !confirm}
          className="w-full py-4 rounded-full bg-[#E0175C] text-white font-bold disabled:opacity-40 transition-opacity"
        >
          {status === "saving" || status === "done"
            ? t("reset.updating")
            : t("reset.submit")}
        </button>
      </div>
    </main>
  );
}
