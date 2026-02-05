"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import PhotoUploader from "./PhotoUploader";

type PromptRow = { id: number; question: string };

export default function OnboardingPage() {
  const currentYear = new Date().getFullYear();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [birthYear, setBirthYear] = useState<number>(currentYear - 30);
  const [gender, setGender] = useState<string>("woman");
  const [city, setCity] = useState<string>("Prague");
  const [bio, setBio] = useState<string>("");

  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [errorMsg, setErrorMsg] = useState<string>("");

  const selectedPromptIds = useMemo(() => prompts.slice(0, 3).map((p) => p.id), [prompts]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setErrorMsg("");

      // 1) Must be logged in
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        window.location.href = "/login";
        return;
      }

      // 2) Load prompts
      const { data: promptData, error: promptErr } = await supabase
        .from("prompts")
        .select("id, question")
        .eq("is_active", true)
        .order("id", { ascending: true });

      if (promptErr) {
        setErrorMsg(promptErr.message);
        setLoading(false);
        return;
      }

      // 3) Load existing profile (if any)
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("birth_year, gender, city, bio")
        .single();

      // profile may not exist yet -> ignore "no rows" case
      if (profileErr && profileErr.code !== "PGRST116") {
        setErrorMsg(profileErr.message);
        setLoading(false);
        return;
      }

      // 4) Load existing prompt answers (if any)
      const { data: existingAnswers, error: ansErr } = await supabase
        .from("profile_prompts")
        .select("prompt_id, answer");

      if (ansErr) {
        setErrorMsg(ansErr.message);
        setLoading(false);
        return;
      }

      if (!mounted) return;

      setPrompts((promptData as PromptRow[]) ?? []);

      if (profileData) {
        setBirthYear(profileData.birth_year);
        setGender(profileData.gender);
        setCity(profileData.city);
        setBio(profileData.bio ?? "");
      }

      const mapped: Record<number, string> = {};
      (existingAnswers ?? []).forEach((row: any) => {
        mapped[row.prompt_id] = row.answer;
      });
      setAnswers(mapped);

      setLoading(false);
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  function setAnswer(promptId: number, value: string) {
    setAnswers((prev) => ({ ...prev, [promptId]: value }));
  }

  function validate(): string | null {
    if (birthYear < 1900 || birthYear > currentYear) return "Birth year looks off.";
    if (!gender) return "Pick a gender option.";
    if (!city.trim()) return "City is required.";

    for (const pid of selectedPromptIds) {
      const a = (answers[pid] ?? "").trim();
      if (a.length < 3) return "Please answer all 3 prompts (a bit more than 2 letters 😄).";
    }
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
    const uid = sessionData.session?.user?.id;
    if (!uid) {
      window.location.href = "/login";
      return;
    }

    // Upsert profile
    const { error: upsertErr } = await supabase.from("profiles").upsert(
      {
        user_id: uid,
        birth_year: birthYear,
        gender,
        city: city.trim(),
        bio: bio.trim() || null,
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

    // Upsert prompt answers (3 prompts)
    const rows = selectedPromptIds.map((pid) => ({
      user_id: uid,
      prompt_id: pid,
      answer: (answers[pid] ?? "").trim(),
    }));

    const { error: ansUpsertErr } = await supabase
      .from("profile_prompts")
      .upsert(rows, { onConflict: "user_id,prompt_id" });

    if (ansUpsertErr) {
      setSaving(false);
      setErrorMsg(ansUpsertErr.message);
      return;
    }

    setSaving(false);
    window.location.href = "/app";
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-300">Loading…</p>
      </main>
    );
  }

  const promptSlice = prompts.slice(0, 3);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl space-y-6">
        <h1 className="text-3xl font-semibold">Onboarding</h1>
        <p className="text-neutral-300">
          Unseen is for real connection. No “looking for” menu. You’re here, you mean it.
        </p>

        {errorMsg ? (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-red-200">
            {errorMsg}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4">
          <label className="space-y-1">
            <div className="text-sm text-neutral-300">Birth year</div>
            <input
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(parseInt(e.target.value || `${currentYear - 30}`, 10))}
              className="w-full rounded-md px-4 py-3 text-black"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm text-neutral-300">Gender</div>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-md px-4 py-3 text-black"
            >
              <option value="woman">Woman</option>
              <option value="man">Man</option>
              <option value="nonbinary">Non-binary</option>
            </select>
          </label>

          <label className="space-y-1">
            <div className="text-sm text-neutral-300">City</div>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-md px-4 py-3 text-black"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm text-neutral-300">Short bio (optional)</div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-md px-4 py-3 text-black"
              rows={3}
              placeholder="A couple lines. Human, not a CV."
            />
          </label>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Three prompts</h2>

          {promptSlice.length < 3 ? (
            <p className="text-neutral-300">
              I can’t see at least 3 prompts in the database yet. (Go run the SQL seed.)
            </p>
          ) : (
            promptSlice.map((p) => (
              <label key={p.id} className="block space-y-2">
                <div className="text-sm text-neutral-200">{p.question}</div>
                <textarea
                  value={answers[p.id] ?? ""}
                  onChange={(e) => setAnswer(p.id, e.target.value)}
                  className="w-full rounded-md px-4 py-3 text-black"
                  rows={3}
                />
              </label>
            ))
          )}
        </div>
        <div className="pt-6 border-t border-white/10">
  <PhotoUploader />
</div>

        <button
          onClick={save}
          disabled={saving || promptSlice.length < 3}
          className="w-full rounded-full bg-white px-6 py-3 font-medium text-black disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save & Continue"}
        </button>
      </div>
    </main>
  );
}