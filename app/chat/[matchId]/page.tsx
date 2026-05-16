"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useRef } from "react";
import { useT } from "../../../lib/i18n/I18nProvider";

const EMOJI_GROUPS = [
  { label: "On fire",    emojis: ["🔥", "💘", "😍", "🥰", "💫", "⭐"] },
  { label: "Playful",   emojis: ["😏", "🙈", "🫠", "🥴", "😳", "🤭"] },
  { label: "Meh",       emojis: ["🥱", "💀", "🚩", "👀", "🫤", "❄️"] },
  { label: "Angry",     emojis: ["😠", "😤", "🤬", "💢"] },
  { label: "Hearts",    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎"] },
  { label: "Hands",     emojis: ["👍", "👎", "🤝", "🤙", "👌", "🫶", "🙌"] },
  { label: "Animals",   emojis: ["🦊", "🐶", "🦄", "🐻", "🐬", "🦋", "🐙", "🦔", "🐝", "🐺"] },
  { label: "Vibe",      emojis: ["🌊", "✨", "🌙", "🌸", "☕", "🍷"] },
];

type MessageRow = {
  id: number;
  sender_id: string;
  content: string;
  created_at: string;
  match_id?: number;
};

type DatePlanRow = {
  id: number;
  planned_for: string;
  place: string;
  notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_email: string | null;
  check_in_after_minutes: number;
  created_at: string;
};

export default function ChatPage() {
  const router = useRouter();
  const t = useT();
  const params = useParams();
  const matchId = params.matchId as string;

  const [label, setLabel] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [myUserId, setMyUserId] = useState<string>("");
  const [otherUserId, setOtherUserId] = useState<string>("");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [emoji, setEmoji] = useState<string | null>(null);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDatePlanModal, setShowDatePlanModal] = useState(false);
  const [datePlannedFor, setDatePlannedFor] = useState("");
  const [datePlace, setDatePlace] = useState("");
  const [dateNotes, setDateNotes] = useState("");
  const [dateContactName, setDateContactName] = useState("");
  const [dateContactPhone, setDateContactPhone] = useState("");
  const [dateContactEmail, setDateContactEmail] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [showUnmatchModal, setShowUnmatchModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("Inappropriate messages");
  const [reportDetails, setReportDetails] = useState("");
  const [latestDatePlan, setLatestDatePlan] = useState<DatePlanRow | null>(null);
  const [isEditingDatePlan, setIsEditingDatePlan] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function loadAndSubscribe() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      if (cancelled) return;
      setMyUserId(session.user.id);

      // Wave 1: onboarding check + emoji pref + match data all in parallel
      const [ownProfileResult, prefResult, matchResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("onboarded_at")
          .eq("user_id", session.user.id)
          .maybeSingle(),
        supabase
          .from("match_preferences")
          .select("emoji")
          .eq("match_id", Number(matchId))
          .eq("user_id", session.user.id)
          .maybeSingle(),
        supabase
          .from("matches")
          .select("match_label, chat_unlock_at, unmatched_at, user_a, user_b")
          .eq("id", Number(matchId))
          .maybeSingle(),
      ]);

      if (cancelled) return;

      if (!ownProfileResult.data?.onboarded_at) {
        router.replace("/onboarding");
        return;
      }

      const matchData = matchResult.data;

      // Match doesn't exist (deleted, bad URL) → bounce to matches list.
      if (!matchData) {
        router.replace("/matches");
        return;
      }

      if (matchData.unmatched_at) {
        router.replace("/matches");
        return;
      }

      if (new Date() < new Date(matchData.chat_unlock_at)) {
        router.replace("/matches");
        return;
      }

      setEmoji(prefResult.data?.emoji ?? null);
      setLabel(matchData.match_label);
      setOtherUserId(matchData.user_a === session.user.id ? matchData.user_b : matchData.user_a);

      // Wave 2: date plan + messages in parallel
      const [datePlanResult, messagesResult] = await Promise.all([
        supabase
          .from("date_plans")
          .select(
            "id, planned_for, place, notes, emergency_contact_name, emergency_contact_phone, emergency_contact_email, check_in_after_minutes, created_at"
          )
          .eq("match_id", Number(matchId))
          .order("planned_for", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("messages")
          .select("id, sender_id, content, created_at")
          .eq("match_id", matchId)
          .order("created_at", { ascending: true }),
      ]);

      if (cancelled) return;

      setLatestDatePlan((datePlanResult.data as DatePlanRow | null) ?? null);
      setMessages((messagesResult.data as MessageRow[]) ?? []);
      setLoading(false);
      await markConversationRead();

      channel = supabase
        .channel(`messages-${matchId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `match_id=eq.${matchId}`,
          },
          (payload) => {
            const newRow = payload.new as MessageRow;

            setMessages((prev) => {
              const alreadyExists = prev.some((m) => m.id === newRow.id);
              if (alreadyExists) return prev;
              return [...prev, newRow];
            });

            if (newRow.sender_id !== session.user.id) {
              markConversationRead();
            }
          }
        )
        .subscribe();
    }

    loadAndSubscribe();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      markConversationRead();
    }
  }, [loading, messages.length]);

  async function markConversationRead() {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;

    if (!uid) return;

    const { error } = await supabase
      .from("match_preferences")
      .upsert(
        {
          match_id: Number(matchId),
          user_id: uid,
          last_read_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "match_id,user_id" }
      );

    if (error) {
      console.error("READ MARK ERROR:", error.message);
    }
  }

  async function saveEmoji(nextEmoji: string | null) {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;

    if (!uid) return;

    const { error } = await supabase
      .from("match_preferences")
      .upsert(
        {
          match_id: Number(matchId),
          user_id: uid,
          emoji: nextEmoji,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "match_id,user_id" }
      );

    if (error) {
      console.error(error.message);
      return;
    }

    setEmoji(nextEmoji);
    setShowEmojiMenu(false);
  }

  async function sendMessage() {
    const content = newMessage.trim();
    if (!content || !myUserId || sending) return;

    const { data: matchCheck } = await supabase
      .from("matches")
      .select("unmatched_at")
      .eq("id", Number(matchId))
      .maybeSingle();

    if (matchCheck?.unmatched_at) {
      router.replace("/matches");
      return;
    }
  
    setSending(true);
  
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: myUserId,
      content,
    });
  
    if (error) {
      alert(error.message);
      setSending(false);
      return;
    }
  
    setNewMessage("");
    setSending(false);
  }

  async function unmatchConversation() {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;

    if (!uid) return;

    const { data, error } = await supabase
      .from("matches")
      .update({
        unmatched_at: new Date().toISOString(),
        unmatched_by: uid,
      })
      .eq("id", Number(matchId))
      .select();

    if (error) {
      console.error("UNMATCH ERROR:", error.message);
      return;
    }

    console.log("UNMATCH SUCCESS:", data);

    router.replace("/matches");
  }

  async function submitReport() {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;

    if (!uid || !otherUserId) return;

    const res = await fetch("/api/reports/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportedId: otherUserId,
        matchId: Number(matchId),
        reason: reportReason,
        details: reportDetails.trim() || null,
      }),
    });

    const json = await res.json().catch(() => null);

    if (!json?.ok) {
      console.error("REPORT ERROR:", json?.error);
      alert(json?.error ?? "Could not submit report.");
      return;
    }

    setShowReportModal(false);
    setReportReason("Inappropriate messages");
    setReportDetails("");
    alert(t("chat.report_submitted"));
  }

  function openEditDatePlan() {
    if (!latestDatePlan) return;

    setDatePlannedFor(latestDatePlan.planned_for.slice(0, 16));
    setDatePlace(latestDatePlan.place ?? "");
    setDateNotes(latestDatePlan.notes ?? "");
    setDateContactName(latestDatePlan.emergency_contact_name ?? "");
    setDateContactPhone(latestDatePlan.emergency_contact_phone ?? "");
    setDateContactEmail(latestDatePlan.emergency_contact_email ?? "");
    setIsEditingDatePlan(true);
    setShowDatePlanModal(true);
  }

  async function saveDatePlan() {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;

    if (!uid) return;

    if (!datePlannedFor.trim()) {
      alert(t("chat.date_plan.error_date_required"));
      return;
    }

    if (!datePlace.trim()) {
      alert(t("chat.date_plan.error_place_required"));
      return;
    }

    let error: { message: string } | null = null;
    let savedId = latestDatePlan?.id ?? 0;
    let savedCreatedAt = latestDatePlan?.created_at ?? new Date().toISOString();

    if (isEditingDatePlan && latestDatePlan?.id) {
      const response = await supabase
        .from("date_plans")
        .update({
          planned_for: datePlannedFor,
          place: datePlace.trim(),
          notes: dateNotes.trim() || null,
          emergency_contact_name: dateContactName.trim() || null,
          emergency_contact_phone: dateContactPhone.trim() || null,
          emergency_contact_email: dateContactEmail.trim() || null,
          check_in_after_minutes: 30,
        })
        .eq("id", latestDatePlan.id)
        .select("id, created_at")
        .single();

      error = response.error;
      if (response.data) {
        savedId = response.data.id;
        savedCreatedAt = response.data.created_at;
      }
    } else {
      const response = await supabase
        .from("date_plans")
        .insert({
          match_id: Number(matchId),
          created_by: uid,
          planned_for: datePlannedFor,
          place: datePlace.trim(),
          notes: dateNotes.trim() || null,
          emergency_contact_name: dateContactName.trim() || null,
          emergency_contact_phone: dateContactPhone.trim() || null,
          emergency_contact_email: dateContactEmail.trim() || null,
          check_in_after_minutes: 30,
        })
        .select("id, created_at")
        .single();

      error = response.error;
      if (response.data) {
        savedId = response.data.id;
        savedCreatedAt = response.data.created_at;
      }
    }

    if (error) {
      console.error("DATE PLAN ERROR:", error.message);
      alert(error.message);
      return;
    }

    const savedPlan: DatePlanRow = {
      id: savedId,
      planned_for: datePlannedFor,
      place: datePlace.trim(),
      notes: dateNotes.trim() || null,
      emergency_contact_name: dateContactName.trim() || null,
      emergency_contact_phone: dateContactPhone.trim() || null,
      emergency_contact_email: dateContactEmail.trim() || null,
      check_in_after_minutes: 30,
      created_at: savedCreatedAt,
    };

    setLatestDatePlan(savedPlan);
    setShowDatePlanModal(false);
    setIsEditingDatePlan(false);
    setDatePlannedFor("");
    setDatePlace("");
    setDateNotes("");
    setDateContactName("");
    setDateContactPhone("");
    setDateContactEmail("");

  }

  async function cancelDatePlan() {
    if (!latestDatePlan?.id) return;

    const { data, error } = await supabase
      .from("date_plans")
      .delete()
      .eq("id", Number(latestDatePlan.id))
      .select("id");

    if (error) {
      console.error("DELETE DATE PLAN ERROR:", error.message);
      alert(error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.error("DELETE DATE PLAN ERROR: No row was deleted.");
      alert(t("chat.date_plan.error_cancel_blocked"));
      return;
    }

    setLatestDatePlan(null);
    setIsEditingDatePlan(false);
    setShowDatePlanModal(false);
    setDatePlannedFor("");
    setDatePlace("");
    setDateNotes("");
    setDateContactName("");
    setDateContactPhone("");
    setDateContactEmail("");

  }

  if (loading) {
    return (
      <main className="h-screen flex items-center justify-center">
        <p>{t("common.loading")}</p>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-white">
      <div className="sticky top-0 z-10 bg-white px-6 py-4 flex items-center gap-3">
        <img
          src="/brand/icononly_transparent_nobuffer.png"
          alt="Unseen"
          className="h-8 w-auto object-contain"
        />

        <h1 className="text-xl font-bold flex-1">{label}</h1>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiMenu((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDE8EF] text-xl leading-none text-neutral-600"
          >
            {emoji ?? "＋"}
          </button>

          {showEmojiMenu && (
            <div className="absolute right-0 top-12 z-20 w-64 rounded-2xl bg-white shadow-lg border border-[#EDE3DA] p-3 max-h-72 overflow-y-auto">
              {EMOJI_GROUPS.map((group) => (
                <div key={group.label} className="mb-2">
                  <p className="text-[10px] font-semibold text-[#A89488] uppercase tracking-wider mb-1 px-1">{group.label}</p>
                  <div className="grid grid-cols-6 gap-0.5">
                    {group.emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => saveEmoji(emoji)}
                        className="flex items-center justify-center h-9 w-9 rounded-xl text-xl active:bg-[#FAF3EE] transition"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="border-t border-[#EDE3DA] mt-1 pt-2">
                <button
                  type="button"
                  onClick={() => saveEmoji(null)}
                  className="w-full py-1.5 text-xs text-[#E0175C] active:bg-[#FAF3EE] rounded-xl transition"
                >
                  {t("chat.clear_emoji")}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
  <button
    type="button"
    onClick={() => setShowMenu((v) => !v)}
    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDE8EF] text-xl text-neutral-600"
  >
    ⋯
  </button>

  {showMenu && (
    <div className="absolute right-0 top-12 z-20 w-48 rounded-xl bg-white shadow-xl border border-neutral-200 py-2">
      
      <button
        onClick={() => {
          setShowMenu(false);
          setShowUnmatchModal(true);
        }}
        className="w-full px-4 py-2 text-left hover:bg-neutral-100"
      >
        {t("chat.unmatch")}
      </button>

      <button
        onClick={() => {
          setShowMenu(false);
          setShowReportModal(true);
        }}
        className="w-full px-4 py-2 text-left hover:bg-neutral-100"
      >
        {t("chat.report")}
      </button>

      <button
        onClick={() => {
          setShowMenu(false);
          if (latestDatePlan) {
            openEditDatePlan();
          } else {
            setIsEditingDatePlan(false);
            setDatePlannedFor("");
            setDatePlace("");
            setDateNotes("");
            setDateContactName("");
            setDateContactPhone("");
            setDateContactEmail("");
            setShowDatePlanModal(true);
          }
        }}
        className="w-full px-4 py-2 text-left hover:bg-neutral-100"
      >
        {latestDatePlan ? t("chat.edit_date_plan") : t("chat.plan_a_date")}
      </button>

    </div>
  )}
</div>

        <button
          onClick={() => router.push("/matches")}
          className="text-lg text-neutral-500"
        >
          ✕
        </button>
      </div>

      {showDatePlanModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{isEditingDatePlan ? t("chat.date_plan.heading_edit") : t("chat.date_plan.heading_create")}</h2>
              <button
                type="button"
                onClick={() => {
                  setShowDatePlanModal(false);
                  setIsEditingDatePlan(false);
                }}
                className="text-lg text-neutral-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-600 mb-2">{t("chat.date_plan.date_time")}</label>
                <input
                  type="datetime-local"
                  value={datePlannedFor}
                  onChange={(e) => setDatePlannedFor(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-2">{t("chat.date_plan.place")}</label>
                <input
                  value={datePlace}
                  onChange={(e) => setDatePlace(e.target.value)}
                  placeholder={t("chat.date_plan.place_placeholder")}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const query = encodeURIComponent(datePlace.trim());
                      if (!query) return;
                      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
                    }}
                    className="rounded-full bg-[#FDE8EF] px-4 py-2 text-sm text-black"
                  >
                    {t("chat.date_plan.open_maps")}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-2">{t("chat.date_plan.notes")}</label>
                <textarea
                  value={dateNotes}
                  onChange={(e) => setDateNotes(e.target.value)}
                  placeholder={t("chat.date_plan.optional_details")}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 min-h-[90px] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-2">{t("chat.date_plan.contact_name")}</label>
                <input
                  value={dateContactName}
                  onChange={(e) => setDateContactName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-2">{t("chat.date_plan.contact_phone")}</label>
                <input
                  value={dateContactPhone}
                  onChange={(e) => setDateContactPhone(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-2">{t("chat.date_plan.contact_email")}</label>
                <input
                  value={dateContactEmail}
                  onChange={(e) => setDateContactEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3"
                />
              </div>

              <div className="flex gap-3 pt-2">
                {isEditingDatePlan && latestDatePlan ? (
                  <button
                    type="button"
                    onClick={cancelDatePlan}
                    className="rounded-full border border-neutral-200 px-4 py-3 text-red-500"
                  >
                    {t("chat.date_plan.cancel_date")}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    setShowDatePlanModal(false);
                    setIsEditingDatePlan(false);
                  }}
                  className="flex-1 rounded-full border border-neutral-200 px-4 py-3"
                >
                  {t("common.close")}
                </button>

                <button
                  type="button"
                  onClick={saveDatePlan}
                  className="flex-1 rounded-full bg-[#E0175C] px-4 py-3 text-white"
                >
                  {isEditingDatePlan ? t("common.update") : t("common.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {latestDatePlan && (
          <div className="rounded-2xl bg-[#FDE8EF] p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-black">{t("chat.date_card.title")}</div>
              <div className="text-xs text-neutral-600">
                {t("chat.date_card.checkin_after", { n: latestDatePlan.check_in_after_minutes })}
              </div>
            </div>

            <div className="text-sm text-black">
              {new Date(latestDatePlan.planned_for).toLocaleString([], {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>

            <div className="text-sm text-black">{latestDatePlan.place}</div>

            <div className="flex gap-2 pt-1">
  <button
    type="button"
    onClick={() => {
      const query = encodeURIComponent(latestDatePlan.place);
      if (!query) return;
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
    }}
    className="rounded-full bg-white px-3 py-1 text-xs border border-neutral-200"
  >
    {t("chat.date_card.open_maps")}
  </button>
  <button
    type="button"
    onClick={openEditDatePlan}
    className="rounded-full bg-white px-3 py-1 text-xs border border-neutral-200"
  >
    {t("chat.date_card.edit")}
  </button>
  <button
    type="button"
    onClick={cancelDatePlan}
    className="rounded-full bg-white px-3 py-1 text-xs border border-neutral-200 text-red-500"
  >
    {t("chat.date_card.cancel_date")}
  </button>
</div>

            {latestDatePlan.notes ? (
              <div className="text-sm text-neutral-700">{latestDatePlan.notes}</div>
            ) : null}

            {(latestDatePlan.emergency_contact_name ||
              latestDatePlan.emergency_contact_phone ||
              latestDatePlan.emergency_contact_email) && (
              <div className="pt-1 text-xs text-neutral-700 space-y-1">
                <div className="font-medium text-neutral-800">{t("chat.date_card.emergency_contact")}</div>
                {latestDatePlan.emergency_contact_name ? (
                  <div>{latestDatePlan.emergency_contact_name}</div>
                ) : null}
                {latestDatePlan.emergency_contact_phone ? (
                  <div>{latestDatePlan.emergency_contact_phone}</div>
                ) : null}
                {latestDatePlan.emergency_contact_email ? (
                  <div>{latestDatePlan.emergency_contact_email}</div>
                ) : null}
              </div>
            )}
          </div>
        )}
        {messages.length === 0 ? (
          <p className="text-neutral-500">{t("chat.no_messages")}</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                m.sender_id === myUserId
                  ? "ml-auto bg-[#E0175C] text-white"
                  : "bg-[#FDE8EF] text-black"
              }`}
            >
            <div className="flex flex-col">
            <span className="text-sm">{m.content}</span>
  <span className="text-[11px] opacity-50 mt-1">
    {new Date(m.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}
  </span>
</div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 bg-white px-6 py-4">
        <div className="flex gap-3">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t("chat.write_message")}
            className="flex-1 rounded-full border px-4 py-3"
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessage();
                }
              }}
          />
         <button
  onClick={sendMessage}
  disabled={sending}
  className="px-6 py-3 rounded-full bg-[#E0175C] text-white disabled:opacity-50"
>
  {sending ? t("chat.sending") : t("chat.send")}
</button>
        </div>
      </div>

      {showUnmatchModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t("chat.unmatch.heading")}</h2>
              <button
                type="button"
                onClick={() => setShowUnmatchModal(false)}
                className="text-lg text-neutral-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-neutral-600">{t("chat.unmatch.body")}</p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnmatchModal(false)}
                  className="flex-1 rounded-full border border-neutral-200 px-4 py-3"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowUnmatchModal(false);
                    await unmatchConversation();
                  }}
                  className="flex-1 rounded-full bg-[#E0175C] px-4 py-3 text-white"
                >
                  {t("chat.unmatch")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t("chat.report.heading")}</h2>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-lg text-neutral-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-600 mb-2">{t("chat.report.reason_label")}</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3"
                >
                  <option value="Inappropriate messages">{t("chat.report.reason_inappropriate")}</option>
                  <option value="Harassment">{t("chat.report.reason_harassment")}</option>
                  <option value="Fake profile">{t("chat.report.reason_fake")}</option>
                  <option value="Other">{t("chat.report.reason_other")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-600 mb-2">{t("chat.report.details_label")}</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder={t("chat.report.optional_details")}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 min-h-[100px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 rounded-full border border-neutral-200 px-4 py-3"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={submitReport}
                  className="flex-1 rounded-full bg-[#E0175C] px-4 py-3 text-white"
                >
                  {t("common.submit")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}