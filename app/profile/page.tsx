"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import BottomNav from "../components/BottomNav";
import PhotoUploader from "../onboarding/PhotoUploader";
import { useT } from "../../lib/i18n/I18nProvider";
import {
  emptyScores,
  GROUP_ORDER,
  indicesForGroup,
  normalizeScores,
  SLIDER_COUNT,
  type SliderGroup,
} from "../../lib/personality";

// Free tier limit. Premium will raise this to 3 in Phase E.
const PRIORITY_LIMIT = 1;

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

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const noApprovedPhoto = searchParams.get("no_approved_photo") === "1";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [personality, setPersonality] = useState<number[]>(emptyScores());
  const [priorities, setPriorities] = useState<number[]>([]);
  const [birthYear, setBirthYear] = useState<number | null>(null);

  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      // Show the form shell immediately while the profile loads
      setLoading(false);

      const { data, error } = await supabase
        .from("profiles")
        .select("onboarded_at, gender, city, languages, personality_scores, priority_sliders, date_of_birth, birth_year")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data?.onboarded_at) {
        router.replace("/onboarding");
        return;
      }

      setGender(data.gender ?? "");
      setCity(data.city ?? "");
      setLanguages(data.languages ?? []);
      setPersonality(normalizeScores(data.personality_scores));

      // Derive birth_year from date_of_birth if available, else use existing birth_year
      if (data.date_of_birth) {
        setBirthYear(new Date(data.date_of_birth).getFullYear());
      } else if (data.birth_year) {
        setBirthYear(data.birth_year);
      } else {
        // Fall back to user metadata (set during signup)
        const dob = session.user.user_metadata?.date_of_birth;
        if (dob) setBirthYear(new Date(dob).getFullYear());
      }

      // Defensive read: priority_sliders is an int[] of indices 0..24.
      const rawPriorities = Array.isArray(data.priority_sliders)
        ? data.priority_sliders
            .map((v: unknown) => Number(v))
            .filter((v: number) => Number.isInteger(v) && v >= 0 && v < SLIDER_COUNT)
            .slice(0, PRIORITY_LIMIT)
        : [];
      setPriorities(rawPriorities);
    }

    loadProfile();
  }, [router]);

  async function saveProfile() {
    setMessage("");

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      router.replace("/login");
      return;
    }

    if (!gender) {
      setMessage(t("profile.error.gender"));
      return;
    }

    if (!city.trim()) {
      setMessage(t("profile.error.city"));
      return;
    }

    setSaving(true);

    const upsertPayload: Record<string, unknown> = {
      user_id: session.user.id,
      gender,
      city: city.trim(),
      languages,
      personality_scores: personality,
      priority_sliders: priorities.length > 0 ? priorities : null,
      onboarded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (birthYear) upsertPayload.birth_year = birthYear;

    const { error } = await supabase.from("profiles").upsert(upsertPayload, { onConflict: "user_id" });

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(t("profile.saved"));
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
        <h1 className="text-xl font-bold">{t("profile.heading")}</h1>
      </div>

      <div className="space-y-4">

        {noApprovedPhoto && (
          <div className="rounded-2xl bg-[#FFF3CD] border border-[#FFDFA0] px-5 py-4">
            <p className="text-sm font-medium text-[#5A4500]">{t("profile.no_approved_photo_heading")}</p>
            <p className="text-xs text-[#7A6000] mt-1">{t("profile.no_approved_photo_body")}</p>
          </div>
        )}

        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-neutral-600 mb-4">{t("profile.photos")}</p>
          <PhotoUploader />
        </div>

        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-neutral-600 mb-2">{t("profile.gender_label")}</p>
          <div className="bg-[#FAF3EE] rounded-xl px-4 py-3">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-transparent outline-none text-base text-[#1C1410]"
            >
              <option value="">{t("profile.select_gender")}</option>
              <option value="woman">{t("gender.woman")}</option>
              <option value="man">{t("gender.man")}</option>
              <option value="nonbinary">{t("gender.nonbinary")}</option>
            </select>
          </div>
        </div>

        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-neutral-600 mb-2">{t("profile.city_label")}</p>
          <div className="bg-[#FAF3EE] rounded-xl px-4 py-3">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-transparent outline-none text-black placeholder:text-neutral-400"
              placeholder={t("city.Prague")}
            />
          </div>
        </div>

        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-neutral-600 mb-3">{t("profile.languages_label")}</p>

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

          <p className="text-xs text-neutral-600 mt-3">{t("profile.languages_help")}</p>
        </div>

        {/* Personality (optional) */}
        <div className="bg-white border border-[#EDE3DA] rounded-2xl p-5 shadow-sm space-y-5">
          <div>
            <p className="text-base font-semibold text-black">{t("personality.heading")}</p>
            <p className="text-xs text-neutral-600 mt-1">{t("personality.intro")}</p>
          </div>

          {GROUP_ORDER.map((group: SliderGroup) => (
            <div key={group} className="space-y-3">
              <p className="text-sm font-semibold text-black">
                {t(`personality.group.${group}.title`)}
              </p>
              {indicesForGroup(group).map((i) => {
                const isPriority = priorities.includes(i);
                const atLimit = priorities.length >= PRIORITY_LIMIT;
                const disabled = !isPriority && atLimit;

                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-700">
                      <span>{t(`personality.slider.${i}.left`)}</span>
                      <span>{t(`personality.slider.${i}.right`)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={personality[i]}
                        onChange={(e) => {
                          const next = [...personality];
                          next[i] = Number(e.target.value);
                          setPersonality(next);
                        }}
                        className="flex-1 accent-[#E0175C] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (isPriority) {
                            setPriorities(priorities.filter((p) => p !== i));
                          } else if (!atLimit) {
                            setPriorities([...priorities, i]);
                          }
                        }}
                        disabled={disabled}
                        aria-label={
                          isPriority
                            ? "Remove from priorities"
                            : disabled
                            ? "Priority limit reached"
                            : "Mark as priority"
                        }
                        className={`text-xl leading-none transition ${
                          isPriority
                            ? "text-[#FACC15] cursor-pointer"
                            : disabled
                            ? "text-neutral-300 cursor-not-allowed"
                            : "text-neutral-400 hover:text-[#FACC15] cursor-pointer"
                        }`}
                      >
                        {isPriority ? "★" : "☆"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          <p className="text-xs text-neutral-600 pt-2">{t("priority.help")}</p>
        </div>

        {message ? (
          <p className="text-sm text-neutral-600 px-1">{message}</p>
        ) : null}

        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full py-4 rounded-full bg-[#E0175C] text-white font-medium disabled:opacity-50"
        >
          {saving ? t("common.saving") : t("profile.save")}
        </button>
      </div>

      <BottomNav />
    </main>
  );
}