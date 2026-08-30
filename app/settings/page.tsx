"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import BottomNav from "../components/BottomNav";
import { useT, useLocale } from "../../lib/i18n/I18nProvider";
import { LOCALES, LOCALE_LABELS, type Locale } from "../../lib/i18n";
import OnboardingModal from "../components/OnboardingModal";

const SUPPORT_EMAIL = "unseen-support@randenibezfiltru.cz";

function resetSupabaseClientState() {
  // Mirrors the dashboard recovery logic — keeps logout/delete behavior consistent.
  try {
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

function formatMemberSince(iso: string | null, locale: Locale) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(locale === "cs" ? "cs-CZ" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const t = useT();
  const { locale, setLocale } = useLocale();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<{ id: number; blocked_id: string; label: string | null }[]>([]);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null);

  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  // Notification preferences
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifNewMatch, setNotifNewMatch] = useState(true);

  // Subscription state
  const [isPremium, setIsPremium] = useState(false);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showPremiumOnboarding, setShowPremiumOnboarding] = useState(false);

  async function loadBlocked() {
    const res = await fetch("/api/block");
    const json = await res.json().catch(() => null);
    if (json?.ok) setBlocked(json.blocked ?? []);
  }

  async function unblock(targetId: string) {
    setUnblocking(targetId);
    await fetch("/api/block", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId }),
    });
    setUnblocking(null);
    setBlocked((prev) => prev.filter((b) => b.blocked_id !== targetId));
  }

  useEffect(() => {
    let cancelled = false;

    async function decide(session: Session | null) {
      if (cancelled) return;

      if (!session) {
        router.replace("/login");
        return;
      }

      void loadBlocked();

      // Gating query — only columns guaranteed to exist
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error || !profile?.onboarded_at) {
        router.replace("/onboarding");
        return;
      }

      setEmail(session.user.email ?? null);
      setMemberSince(session.user.created_at ?? null);
      setLoading(false);

      // Non-blocking: load notification prefs
      void supabase
        .from("profiles")
        .select("notif_messages, notif_new_match")
        .eq("user_id", session.user.id)
        .maybeSingle()
        .then(({ data: notif }) => {
          if (cancelled || !notif) return;
          setNotifMessages(notif.notif_messages ?? true);
          setNotifNewMatch(notif.notif_new_match ?? true);
        });

      // Non-blocking: fetch subscription status
      void fetch("/api/stripe/status", { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          setIsPremium(data.isPremium ?? false);
          setPremiumUntil(data.premiumUntil ?? null);
        })
        .catch(() => {});

      // Premium welcome modal — show once after successful checkout
      try {
        const params = new URLSearchParams(window.location.search);
        if (
          params.get("premium") === "success" &&
          !localStorage.getItem("unseen_premium_onboarding_done")
        ) {
          setShowPremiumOnboarding(true);
        }
      } catch { /* private mode */ }

      // Non-blocking: account fields added by migration — safe to fail silently
      void supabase
        .from("profiles")
        .select("first_name, last_name, date_of_birth")
        .eq("user_id", session.user.id)
        .maybeSingle()
        .then(({ data: acct }) => {
          if (cancelled || !acct) return;
          const name = [acct.first_name ?? "", acct.last_name ?? ""].filter(Boolean).join(" ");
          if (name) setFullName(name);
          if (acct.date_of_birth) setDateOfBirth(acct.date_of_birth);
        });
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

  async function startCheckout() {
    setCheckoutLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "include",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.url) {
        console.error("[checkout] failed", res.status, body);
        setMessage(body?.error === "already_premium" ? "" : t("premium.error"));
        return;
      }
      // Redirect to Stripe's hosted checkout page
      window.location.href = body.url;
    } catch {
      setMessage(t("premium.error"));
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function saveNotifPref(field: "notif_messages" | "notif_new_match", value: boolean) {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) return;
    await supabase.from("profiles").update({ [field]: value }).eq("user_id", uid);
  }

  async function logout() {
    await supabase.auth.signOut();
    resetSupabaseClientState();
    router.replace("/login");
  }

  async function deleteAccount() {
    setMessage("");
    setDeleting(true);

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setMessage(body?.error ?? t("settings.error_delete"));
        setDeleting(false);
        return;
      }

      await supabase.auth.signOut();
      resetSupabaseClientState();
      router.replace("/login");
    } catch {
      setMessage(t("settings.error_delete"));
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>{t("common.loading")}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8 pb-24">
      <div className="flex items-center gap-3 mb-8">
        <img
          src="/brand/icononly_transparent_nobuffer.png"
          alt="Unseen"
          className="h-8 w-auto object-contain"
        />
        <h1 className="text-xl font-bold">{t("settings.heading")}</h1>
      </div>

      <div className="space-y-4">
        {/* LANGUAGE */}
        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5">
          <p className="text-sm text-neutral-600 mb-2">{t("settings.language_label")}</p>
          <div className="bg-[#FAF3EE] rounded-xl px-4 py-3">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="w-full bg-transparent outline-none text-black"
            >
              {LOCALES.map((code) => (
                <option key={code} value={code}>
                  {LOCALE_LABELS[code]}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-neutral-600 mt-2">{t("settings.language_help")}</p>
        </div>

        {/* PREMIUM */}
        {isPremium ? (
          <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-neutral-600">{t("premium.active_label")}</p>
              <span className="text-xs font-bold text-[#E0175C] bg-[#FDE8F0] px-2 py-1 rounded-full">
                {t("premium.badge")}
              </span>
            </div>
            {premiumUntil && (
              <p className="text-xs text-[#A89488]">
                {t("premium.active_until")}{" "}
                {new Date(premiumUntil).toLocaleDateString(locale === "cs" ? "cs-CZ" : "en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5">
            <p className="text-sm font-semibold text-[#1C1410] mb-1">{t("premium.upgrade_heading")}</p>
            <p className="text-xs text-[#6B5A52] mb-4">{t("premium.upgrade_body")}</p>
            <button
              onClick={startCheckout}
              disabled={checkoutLoading}
              className="w-full py-3.5 rounded-full bg-[#E0175C] text-white font-bold text-sm disabled:opacity-50 transition-opacity"
            >
              {checkoutLoading ? t("premium.processing") : t("premium.cta")}
            </button>
          </div>
        )}

        {/* APPEARANCE (placeholder) */}
        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 opacity-60">
          <p className="text-sm text-neutral-600 mb-2">{t("settings.appearance_label")}</p>
          <div className="bg-[#FAF3EE] rounded-xl px-4 py-3 text-neutral-500">
            {t("settings.appearance_value")}
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5">
          <p className="text-sm font-semibold text-[#1C1410] mb-4">{t("profile.notif_heading")}</p>
          <div className="space-y-3">
            {([
              { field: "notif_messages" as const,  label: t("profile.notif_messages"),  val: notifMessages,  set: setNotifMessages },
              { field: "notif_new_match" as const,  label: t("profile.notif_new_match"),  val: notifNewMatch,  set: setNotifNewMatch },
            ]).map(({ field, label, val, set }) => (
              <div key={field} className="flex items-center justify-between gap-3">
                <span className="text-sm text-[#1C1410]">{label}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !val;
                    set(next);
                    void saveNotifPref(field, next);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${val ? "bg-[#E0175C]" : "bg-[#EDE3DA]"}`}
                  aria-pressed={val}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${val ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ACCOUNT */}
        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5">
          <p className="text-sm text-neutral-600 mb-3">{t("settings.account_label")}</p>
          <div className="bg-[#FAF3EE] rounded-xl px-4 py-3 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#A89488]">{t("profile.account_name")}</span>
              <span className="text-sm font-medium text-[#1C1410]">{fullName ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#A89488]">{t("settings.account_email")}</span>
              <span className="text-sm font-medium text-[#1C1410] break-all">{email ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#A89488]">{t("profile.account_dob")}</span>
              <span className="text-sm font-medium text-[#1C1410]">
                {dateOfBirth
                  ? new Date(dateOfBirth).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#A89488]">{t("settings.account_member_since")}</span>
              <span className="text-sm font-medium text-[#1C1410]">{formatMemberSince(memberSince, locale)}</span>
            </div>
          </div>
        </div>

        {/* BLOCKED PEOPLE */}
        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5">
          <p className="text-sm text-neutral-600 mb-1">{t("settings.blocked_users")}</p>
          <p className="text-xs text-[#A89488] mb-3">{t("settings.blocked_users_sub")}</p>
          {blocked.length === 0 ? (
            <p className="bg-[#FAF3EE] rounded-xl px-4 py-3 text-sm text-[#A89488]">
              {t("settings.blocked_empty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {blocked.map((b) => (
                <li key={b.id} className="bg-[#FAF3EE] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[#1C1410]">
                    {b.label ?? t("settings.blocked_unknown")}
                  </span>
                  <button
                    type="button"
                    disabled={unblocking === b.blocked_id}
                    onClick={() => unblock(b.blocked_id)}
                    className="rounded-full border border-[#EDE3DA] bg-white px-4 py-1.5 text-sm text-[#E0175C] disabled:opacity-60"
                  >
                    {t("settings.blocked_unblock")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* HELP */}
        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5">
          <p className="text-sm text-neutral-600 mb-2">{t("settings.help_label")}</p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="block bg-[#FAF3EE] rounded-xl px-4 py-3 text-black"
          >
            {t("settings.help_contact")}
          </a>
        </div>

        {/* LEGAL */}
        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5">
          <p className="text-sm text-neutral-600 mb-2">{t("settings.legal_label")}</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => router.push("/terms")}
              className="w-full text-left bg-[#FAF3EE] rounded-xl px-4 py-3 text-black"
            >
              {t("settings.terms")}
            </button>
            <button
              type="button"
              onClick={() => router.push("/privacy")}
              className="w-full text-left bg-[#FAF3EE] rounded-xl px-4 py-3 text-black"
            >
              {t("settings.privacy")}
            </button>
          </div>
        </div>

        {/* INSTALL APP */}
        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5">
          <p className="text-sm text-neutral-600 mb-2">{t("settings.install_label")}</p>
          <button
            type="button"
            onClick={() => setShowInstallGuide((v) => !v)}
            className="w-full text-left bg-[#FAF3EE] rounded-xl px-4 py-3 text-black"
          >
            {t("settings.install_button")}
          </button>
          {showInstallGuide && (
            <div className="mt-3 space-y-4 text-sm">
              <div>
                <p className="font-semibold text-[#1C1410] mb-1">🍎 {t("settings.install_ios_title")}</p>
                <ol className="list-decimal pl-5 space-y-1 text-[#6B5A52]">
                  <li>{t("settings.install_ios_1")}</li>
                  <li>{t("settings.install_ios_2")}</li>
                  <li>{t("settings.install_ios_3")}</li>
                </ol>
              </div>
              <div>
                <p className="font-semibold text-[#1C1410] mb-1">🤖 {t("settings.install_android_title")}</p>
                <ol className="list-decimal pl-5 space-y-1 text-[#6B5A52]">
                  <li>{t("settings.install_android_1")}</li>
                  <li>{t("settings.install_android_2")}</li>
                  <li>{t("settings.install_android_3")}</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* SESSION */}
        <button
          onClick={logout}
          className="w-full py-4 rounded-full border font-medium"
        >
          {t("settings.logout")}
        </button>

        {/* DANGER */}
        <div className="pt-2">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full py-4 rounded-full border border-red-500 text-red-500 font-medium"
            >
              {t("settings.delete_account")}
            </button>
          ) : (
            <div className="bg-white border border-red-500 rounded-2xl p-5 space-y-3">
              <p className="text-black">{t("settings.delete_confirm_body")}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-full border font-medium disabled:opacity-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={deleteAccount}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-full bg-red-500 text-white font-medium disabled:opacity-50"
                >
                  {deleting ? t("settings.deleting") : t("settings.delete_confirm_button")}
                </button>
              </div>
            </div>
          )}
        </div>

        {message ? (
          <p className="text-sm text-neutral-600 px-1">{message}</p>
        ) : null}
      </div>

      <BottomNav />

      {showPremiumOnboarding && (
        <OnboardingModal
          steps={[
            { emoji: t("premium_onboarding.s1.emoji"), title: t("premium_onboarding.s1.title"), body: t("premium_onboarding.s1.body") },
            { emoji: t("premium_onboarding.s2.emoji"), title: t("premium_onboarding.s2.title"), body: t("premium_onboarding.s2.body") },
            { emoji: t("premium_onboarding.s3.emoji"), title: t("premium_onboarding.s3.title"), body: t("premium_onboarding.s3.body") },
          ]}
          ctaLabel={t("premium_onboarding.cta")}
          onDone={() => {
            setShowPremiumOnboarding(false);
            try { localStorage.setItem("unseen_premium_onboarding_done", "1"); } catch { /* private mode */ }
            router.push("/profile");
          }}
        />
      )}
    </main>
  );
}
