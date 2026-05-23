"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useT } from "../../lib/i18n/I18nProvider";

interface Props {
  uid: string;
  onDone: () => void;
}

function getAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function DobModal({ uid, onDone }: Props) {
  const t = useT();
  const [dob, setDob] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const maxDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split("T")[0];
  })();

  const age = dob ? getAge(dob) : null;
  const valid = age !== null && age >= 18;

  async function save() {
    if (!valid) return;
    setSaving(true);
    setError("");

    const { error: err } = await supabase
      .from("profiles")
      .update({
        date_of_birth: dob,
        birth_year: new Date(dob).getFullYear(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", uid);

    setSaving(false);
    if (err) { setError(err.message); return; }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full bg-white rounded-3xl p-6 space-y-5 shadow-2xl">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-[#FFF0F5] flex items-center justify-center text-3xl">
            🎂
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-[#1C1410]">{t("dob_modal.heading")}</h2>
          <p className="text-sm text-[#6B5A52] leading-relaxed">{t("dob_modal.body")}</p>
        </div>

        {/* Date input */}
        <div className="flex flex-col gap-1">
          <input
            type="date"
            className={`border bg-white px-4 py-3.5 rounded-2xl w-full text-base text-[#1C1410] focus:outline-none transition-colors ${
              valid ? "border-green-400" : "border-[#EDE3DA] focus:border-[#E0175C]"
            }`}
            value={dob}
            max={maxDob}
            onChange={(e) => setDob(e.target.value)}
            autoComplete="bday"
          />
          {!dob && (
            <p className="text-xs text-[#A89488] px-1">{t("signup.dob_confirm_hint")}</p>
          )}
          {valid && (
            <p className="text-xs font-semibold text-green-600 px-1 flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[11px] font-black">✓</span>
              {t("signup.dob_age_confirmed").replace("{age}", String(age))}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button
          onClick={save}
          disabled={!valid || saving}
          className="w-full py-4 rounded-full bg-[#E0175C] text-white font-bold disabled:opacity-40 transition-opacity"
        >
          {saving ? "…" : t("dob_modal.cta")}
        </button>

        <button
          type="button"
          onClick={onDone}
          className="w-full text-sm text-[#A89488] text-center hover:text-[#E0175C] transition-colors pb-1"
        >
          {t("dob_modal.skip")}
        </button>
      </div>
    </div>
  );
}
