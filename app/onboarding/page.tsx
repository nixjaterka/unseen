"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

function clearSupabaseStorage() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-")) localStorage.removeItem(k);
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("sb-")) sessionStorage.removeItem(k);
    }
    localStorage.removeItem("unseen.intro_seen");
  } catch { /* private mode */ }
}
import PhotoUploader from "./PhotoUploader";
import { useT } from "../../lib/i18n/I18nProvider";

const LANGUAGE_OPTIONS = [
  "English",
  "Czech",
  "Slovak",
  "German",
  "French",
  "Spanish",
  "Italian",
  "Polish",
  "Dutch",
  "Portuguese",
  "Romanian",
  "Hungarian",
];

export default function OnboardingPage() {
  const router = useRouter();
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [gender, setGender] = useState<string>("woman");
  const [city, setCity] = useState<string>("Prague");
  const [languages, setLanguages] = useState<string[]>([]);

  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function init() {
      setErrorMsg("");

      // 1) Must be logged in
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      // 2) Load existing profile first so we can short-circuit if already onboarded
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("onboarded_at, gender, city, languages")
        .eq("user_id", sessionData.session.user.id)
        .maybeSingle();

      // profile may not exist yet -> ignore "no rows" case
      if (profileErr && profileErr.code !== "PGRST116") {
        setErrorMsg(profileErr.message);
        setLoading(false);
        return;
      }

      // Already onboarded → no reason to re-do this. Edits live at /profile.
      if (profileData?.onboarded_at) {
        router.replace("/app");
        return;
      }

      // First-time visitors get the three-principle intro before the form.
      // Tracked per-device via localStorage so we don't re-show on refresh.
      try {
        const seen = localStorage.getItem("unseen.intro_seen");
        if (seen !== "1") {
          router.replace("/onboarding/intro");
          return;
        }
      } catch {
        // localStorage unavailable (private mode, etc.) — skip the gate
        // and show the form. Better than getting stuck.
      }

      if (!mounted) return;

      if (profileData) {
        setGender(profileData.gender);
        setCity(profileData.city);
        setLanguages(profileData.languages ?? []);
      }

      setLoading(false);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [router]);

  function validate(): string | null {
    if (!gender) return t("onboarding.error.gender");
    if (!city.trim()) return t("onboarding.error.city");
    if (languages.length === 0) return t("onboarding.error.languages_min");
    if (languages.length > 5) return t("onboarding.error.languages_max");
    return null;
  }

  async function save() {
    setErrorMsg("");
    const validation = validate();
    if (validation) {
      setErrorMsg(validation);
      return;
    }

    setSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    const uid = session?.user?.id;
    if (!uid) {
      router.replace("/login");
      return;
    }

    // Pull account fields from auth metadata (set at signup).
    // This is the authoritative write for users who went through email
    // confirmation — the signup page couldn't write to profiles yet because
    // there was no session at the time.
    const meta = session?.user?.user_metadata ?? {};
    const accountFields: Record<string, unknown> = {};
    if (meta.first_name) accountFields.first_name = meta.first_name;
    if (meta.last_name) accountFields.last_name = meta.last_name;
    if (meta.date_of_birth) {
      accountFields.date_of_birth = meta.date_of_birth;
      // birth_year is a NOT NULL int column — derive it from the full date
      accountFields.birth_year = new Date(meta.date_of_birth).getFullYear();
    }

    // Upsert profile
    const { error: upsertErr } = await supabase.from("profiles").upsert(
      {
        user_id: uid,
        ...accountFields,
        gender,
        city: city.trim(),
        languages,
        onboarded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (upsertErr) {
      setSaving(false);
      setErrorMsg(upsertErr.message);
      return;
    }

    setSaving(false);
    router.replace("/app");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">{t("common.loading")}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8 pb-12">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <img
            src="/brand/icononly_transparent_nobuffer.png"
            alt="Unseen"
            className="h-8 w-auto object-contain"
          />
          <h1 className="text-xl font-bold">{t("onboarding.heading")}</h1>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              clearSupabaseStorage();
              router.replace("/login");
            }}
            className="ml-auto text-xs text-[#A89488] hover:text-[#E0175C] transition-colors"
          >
            {t("settings.logout")}
          </button>
        </div>
        <p className="text-sm text-neutral-500 mb-6">{t("onboarding.intro")}</p>

        {errorMsg ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
            {errorMsg}
          </div>
        ) : null}

        <div className="space-y-4">
          {/* Photos */}
          <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-neutral-600 mb-4">{t("profile.photos")}</p>
            <PhotoUploader />
          </div>

          {/* Gender */}
          <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-neutral-600 mb-2">{t("onboarding.gender")}</p>
            <div className="bg-[#FAF3EE] rounded-xl px-4 py-3">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-transparent outline-none text-base text-[#1C1410]"
              >
                <option value="woman">{t("gender.woman")}</option>
                <option value="man">{t("gender.man")}</option>
                <option value="nonbinary">{t("gender.nonbinary")}</option>
              </select>
            </div>
          </div>

          {/* City */}
          <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-neutral-600 mb-2">{t("onboarding.city")}</p>
            <div className="bg-[#FAF3EE] rounded-xl px-4 py-3">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-transparent outline-none text-black placeholder:text-neutral-400"
                placeholder={t("city.Prague")}
              />
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-neutral-600 mb-3">{t("onboarding.languages")}</p>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGE_OPTIONS.map((lang) => {
                const selected = languages.includes(lang);

                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      if (selected) {
                        setLanguages(languages.filter((l) => l !== lang));
                      } else if (languages.length < 5) {
                        setLanguages([...languages, lang]);
                      }
                    }}
                    className={`rounded-xl px-3 py-3 text-left text-sm ${
                      selected
                        ? "bg-[#E0175C] text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    {t(`language_name.${lang}`)}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-neutral-600 mt-3">
              {t("onboarding.selected_count", { n: languages.length })}
            </p>
          </div>

          {/* Save */}
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-4 rounded-full bg-[#E0175C] text-white font-medium disabled:opacity-50"
          >
            {saving ? t("common.saving") : t("onboarding.save_continue")}
          </button>
        </div>
      </div>
    </main>
  );
}