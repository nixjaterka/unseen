"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { useT } from "../../../lib/i18n/I18nProvider";
import { checkContactInfo } from "../../../lib/contactFilter";
import { pickIcebreakers, type Icebreaker } from "../../../lib/icebreakers";

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

const QUICK_REACTIONS = ["❤️", "😂", "🔥", "😮", "😢", "👍"];

type MessageRow = {
  id: number;
  sender_id: string;
  content: string;
  created_at: string;
  reply_to_id?: number | null;
};

type ReactionRow = {
  id: number;
  message_id: number;
  user_id: string;
  emoji: string;
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
  const [reactions, setReactions] = useState<ReactionRow[]>([]);
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
  const [isUnmatched, setIsUnmatched] = useState(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(null);
  const [icebreakers, setIcebreakers] = useState<Icebreaker[]>([]);
  // "a" | "b" — which slot in matches this viewer occupies
  const mySlotRef = useRef<"a" | "b" | null>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reportReason, setReportReason] = useState("Inappropriate messages");
  const [reportDetails, setReportDetails] = useState("");
  const [latestDatePlan, setLatestDatePlan] = useState<DatePlanRow | null>(null);
  const [isEditingDatePlan, setIsEditingDatePlan] = useState(false);
  const [blockedWarning, setBlockedWarning] = useState<string | null>(null);

  // Reactions & reply state
  const [activeMessageId, setActiveMessageId] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── helpers ─────────────────────────────────────────────────────────────────

  const reactionsFor = useCallback(
    (msgId: number) => reactions.filter((r) => r.message_id === msgId),
    [reactions]
  );

  function groupedReactions(reacts: ReactionRow[]) {
    const map: Record<string, { emoji: string; users: string[] }> = {};
    for (const r of reacts) {
      if (!map[r.emoji]) map[r.emoji] = { emoji: r.emoji, users: [] };
      map[r.emoji].users.push(r.user_id);
    }
    return Object.values(map);
  }

  async function toggleReaction(messageId: number, selectedEmoji: string) {
    if (!myUserId) return;

    // Only ever touch the current user's own reaction — never the other person's
    const existing = reactions.find(
      (r) => r.message_id === messageId && r.user_id === myUserId
    );

    setActiveMessageId(null);

    if (existing?.emoji === selectedEmoji) {
      // Optimistic remove — rollback if DB refuses
      setReactions((prev) => prev.filter((r) => r.id !== existing.id));
      const { error } = await supabase
        .from("message_reactions")
        .delete()
        .eq("id", existing.id)
        .eq("user_id", myUserId); // extra guard: never delete someone else's row
      if (error) {
        setReactions((prev) => [...prev, existing]); // rollback
      }
    } else if (existing) {
      // Optimistic emoji swap — rollback if DB refuses
      setReactions((prev) =>
        prev.map((r) => (r.id === existing.id ? { ...r, emoji: selectedEmoji } : r))
      );
      const { error } = await supabase
        .from("message_reactions")
        .update({ emoji: selectedEmoji })
        .eq("id", existing.id)
        .eq("user_id", myUserId);
      if (error) {
        setReactions((prev) =>
          prev.map((r) => (r.id === existing.id ? existing : r)) // rollback
        );
      }
    } else {
      // Optimistic insert — use temp id, swap for real id on confirm
      const tempId = -Date.now();
      setReactions((prev) => [
        ...prev,
        { id: tempId, message_id: messageId, user_id: myUserId, emoji: selectedEmoji },
      ]);
      const { data, error } = await supabase
        .from("message_reactions")
        .insert({ message_id: messageId, match_id: Number(matchId), user_id: myUserId, emoji: selectedEmoji })
        .select("id")
        .single();
      if (data && !error) {
        setReactions((prev) =>
          prev.map((r) => (r.id === tempId ? { ...r, id: data.id } : r))
        );
      } else {
        setReactions((prev) => prev.filter((r) => r.id !== tempId)); // rollback
      }
    }
  }

  // Long-press handlers
  function handleMsgTouchStart(msgId: number) {
    longPressTimer.current = setTimeout(() => setActiveMessageId(msgId), 480);
  }
  function handleMsgTouchEnd() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  // ── load & subscribe ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function loadAndSubscribe() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) { router.replace("/login"); return; }
      if (cancelled) return;
      setMyUserId(session.user.id);

      const [ownProfileResult, prefResult, matchResult] = await Promise.all([
        supabase.from("profiles").select("onboarded_at").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("match_preferences").select("emoji").eq("match_id", Number(matchId)).eq("user_id", session.user.id).maybeSingle(),
        supabase.from("matches").select("match_label, chat_unlock_at, unmatched_at, user_a, user_b").eq("id", Number(matchId)).maybeSingle(),
      ]);

      // Other user's last_read_at — loaded after we know otherUserId
      // (deferred below once we have the match row)

      if (cancelled) return;

      if (!ownProfileResult.data?.onboarded_at) { router.replace("/onboarding"); return; }

      const matchData = matchResult.data;
      if (!matchData) { router.replace("/matches"); return; }

      if (matchData.unmatched_at) {
        setIsUnmatched(true);
      } else if (new Date() < new Date(matchData.chat_unlock_at)) {
        router.replace("/matches");
        return;
      }

      setEmoji(prefResult.data?.emoji ?? null);
      setLabel(matchData.match_label);
      const slot: "a" | "b" = matchData.user_a === session.user.id ? "a" : "b";
      mySlotRef.current = slot;
      const resolvedOtherUserId = slot === "a" ? matchData.user_b : matchData.user_a;
      setOtherUserId(resolvedOtherUserId);

      // Load other user's last_read_at + personality scores in parallel
      const [otherPref, otherProfile] = await Promise.all([
        supabase
          .from("match_preferences")
          .select("last_read_at")
          .eq("match_id", Number(matchId))
          .eq("user_id", resolvedOtherUserId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("personality_scores")
          .eq("user_id", resolvedOtherUserId)
          .maybeSingle(),
      ]);
      if (!cancelled) {
        setOtherLastReadAt(otherPref.data?.last_read_at ?? null);
        const scores = Array.isArray(otherProfile.data?.personality_scores)
          ? (otherProfile.data.personality_scores as number[])
          : null;
        setIcebreakers(pickIcebreakers(scores, 3));
      }

      const [datePlanResult, messagesResult, reactionsResult] = await Promise.all([
        supabase
          .from("date_plans")
          .select("id, planned_for, place, notes, emergency_contact_name, emergency_contact_phone, emergency_contact_email, check_in_after_minutes, created_at")
          .eq("match_id", Number(matchId))
          .order("planned_for", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("messages")
          .select("id, sender_id, content, created_at, reply_to_id")
          .eq("match_id", matchId)
          .order("created_at", { ascending: true }),
        supabase
          .from("message_reactions")
          .select("id, message_id, user_id, emoji")
          .eq("match_id", matchId),
      ]);

      if (cancelled) return;

      setLatestDatePlan((datePlanResult.data as DatePlanRow | null) ?? null);

      // reply_to_id column may not exist yet if the migration hasn't run —
      // fall back to a select without it so existing messages still show.
      if (messagesResult.error) {
        console.warn("[chat] messages query failed, retrying without reply_to_id:", messagesResult.error.message);
        const { data: fallbackMessages } = await supabase
          .from("messages")
          .select("id, sender_id, content, created_at")
          .eq("match_id", matchId)
          .order("created_at", { ascending: true });
        setMessages((fallbackMessages as MessageRow[]) ?? []);
      } else {
        setMessages((messagesResult.data as MessageRow[]) ?? []);
      }

      // message_reactions table may not exist yet either
      if (!reactionsResult.error) {
        setReactions((reactionsResult.data as ReactionRow[]) ?? []);
      }
      setLoading(false);
      await markConversationRead();

      channel = supabase
        .channel(`messages-${matchId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
          (payload) => {
            const newRow = payload.new as MessageRow;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newRow.id)) return prev;
              return [...prev, newRow];
            });
            if (newRow.sender_id !== session.user.id) markConversationRead();
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "message_reactions", filter: `match_id=eq.${matchId}` },
          (payload) => {
            const r = payload.new as ReactionRow;
            setReactions((prev) => {
              if (prev.some((x) => x.id === r.id)) return prev;
              return [...prev, r];
            });
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "message_reactions", filter: `match_id=eq.${matchId}` },
          (payload) => {
            const r = payload.new as ReactionRow;
            setReactions((prev) => prev.map((x) => (x.id === r.id ? r : x)));
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "message_reactions", filter: `match_id=eq.${matchId}` },
          (payload) => {
            const old = payload.old as { id: number };
            setReactions((prev) => prev.filter((x) => x.id !== old.id));
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "match_preferences", filter: `match_id=eq.${matchId}` },
          (payload) => {
            const row = payload.new as { user_id: string; last_read_at?: string | null };
            // Only care about the other person's read — not our own writes
            if (row.user_id !== session.user.id && row.last_read_at) {
              setOtherLastReadAt(row.last_read_at);
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
          (payload) => {
            const row = payload.new as { typing_at_a?: string | null; typing_at_b?: string | null };
            const otherSlot = mySlotRef.current === "a" ? "b" : "a";
            const otherTypingAt = otherSlot === "a" ? row.typing_at_a : row.typing_at_b;
            if (!otherTypingAt) { setOtherIsTyping(false); return; }
            const age = Date.now() - new Date(otherTypingAt).getTime();
            if (age < 5000) {
              setOtherIsTyping(true);
              if (typingClearRef.current) clearTimeout(typingClearRef.current);
              typingClearRef.current = setTimeout(() => setOtherIsTyping(false), 5000 - age);
            } else {
              setOtherIsTyping(false);
            }
          }
        )
        .subscribe();
    }

    loadAndSubscribe();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherIsTyping]);

  useEffect(() => {
    if (!loading && messages.length > 0) markConversationRead();
  }, [loading, messages.length]);

  useEffect(() => {
    function onFocus() { if (!loading) markConversationRead(); }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loading]);

  async function markConversationRead() {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) return;
    await supabase.from("match_preferences").upsert(
      { match_id: Number(matchId), user_id: uid, last_read_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: "match_id,user_id" }
    );
  }

  async function saveEmoji(nextEmoji: string | null) {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) return;
    const { error } = await supabase.from("match_preferences").upsert(
      { match_id: Number(matchId), user_id: uid, emoji: nextEmoji, updated_at: new Date().toISOString() },
      { onConflict: "match_id,user_id" }
    );
    if (error) { console.error(error.message); return; }
    setEmoji(nextEmoji);
    setShowEmojiMenu(false);
  }

  function handleInputChange(value: string) {
    setNewMessage(value);
    if (blockedWarning) setBlockedWarning(null);

    // Debounce: write typing_at at most once per 2s while the user is typing
    if (!mySlotRef.current || isUnmatched) return;
    if (typingDebounceRef.current) return; // already scheduled
    typingDebounceRef.current = setTimeout(async () => {
      typingDebounceRef.current = null;
      const col = mySlotRef.current === "a" ? "typing_at_a" : "typing_at_b";
      await supabase.from("matches").update({ [col]: new Date().toISOString() }).eq("id", Number(matchId));
    }, 400);
  }

  async function sendMessage() {
    const content = newMessage.trim();
    if (!content || !myUserId || sending) return;

    const filterResult = checkContactInfo(content);
    if (filterResult.blocked) {
      setBlockedWarning(t(`chat.blocked.${filterResult.reason}`));
      return;
    }

    setBlockedWarning(null);
    setSending(true);

    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: Number(matchId),
        content,
        ...(replyTo ? { replyToId: replyTo.id } : {}),
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.ok) {
      if (json?.error === "conversation_ended") { router.replace("/matches"); return; }
      if (json?.error === "contact_info_blocked") {
        setBlockedWarning(t(`chat.blocked.${json.reason ?? "share"}`));
      }
      setSending(false);
      return;
    }

    setNewMessage("");
    setReplyTo(null);
    setIcebreakers([]);
    setSending(false);
  }

  async function unmatchConversation() {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) return;
    const { error } = await supabase.from("matches").update({ unmatched_at: new Date().toISOString(), unmatched_by: uid }).eq("id", Number(matchId));
    if (error) { console.error("UNMATCH ERROR:", error.message); return; }
    router.replace("/matches");
  }

  async function submitReport() {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid || !otherUserId) return;
    const res = await fetch("/api/reports/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportedId: otherUserId, matchId: Number(matchId), reason: reportReason, details: reportDetails.trim() || null }),
    });
    const json = await res.json().catch(() => null);
    if (!json?.ok) { alert(json?.error ?? "Could not submit report."); return; }
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
    if (!datePlannedFor.trim()) { alert(t("chat.date_plan.error_date_required")); return; }
    if (!datePlace.trim()) { alert(t("chat.date_plan.error_place_required")); return; }

    let error: { message: string } | null = null;
    let savedId = latestDatePlan?.id ?? 0;
    let savedCreatedAt = latestDatePlan?.created_at ?? new Date().toISOString();

    if (isEditingDatePlan && latestDatePlan?.id) {
      const response = await supabase.from("date_plans")
        .update({ planned_for: datePlannedFor, place: datePlace.trim(), notes: dateNotes.trim() || null, emergency_contact_name: dateContactName.trim() || null, emergency_contact_phone: dateContactPhone.trim() || null, emergency_contact_email: dateContactEmail.trim() || null, check_in_after_minutes: 30 })
        .eq("id", latestDatePlan.id).select("id, created_at").single();
      error = response.error;
      if (response.data) { savedId = response.data.id; savedCreatedAt = response.data.created_at; }
    } else {
      const response = await supabase.from("date_plans")
        .insert({ match_id: Number(matchId), created_by: uid, planned_for: datePlannedFor, place: datePlace.trim(), notes: dateNotes.trim() || null, emergency_contact_name: dateContactName.trim() || null, emergency_contact_phone: dateContactPhone.trim() || null, emergency_contact_email: dateContactEmail.trim() || null, check_in_after_minutes: 30 })
        .select("id, created_at").single();
      error = response.error;
      if (response.data) { savedId = response.data.id; savedCreatedAt = response.data.created_at; }
    }

    if (error) { console.error("DATE PLAN ERROR:", error.message); alert(error.message); return; }

    setLatestDatePlan({ id: savedId, planned_for: datePlannedFor, place: datePlace.trim(), notes: dateNotes.trim() || null, emergency_contact_name: dateContactName.trim() || null, emergency_contact_phone: dateContactPhone.trim() || null, emergency_contact_email: dateContactEmail.trim() || null, check_in_after_minutes: 30, created_at: savedCreatedAt });
    setShowDatePlanModal(false);
    setIsEditingDatePlan(false);
    setDatePlannedFor(""); setDatePlace(""); setDateNotes(""); setDateContactName(""); setDateContactPhone(""); setDateContactEmail("");
  }

  async function cancelDatePlan() {
    if (!latestDatePlan?.id) return;
    const { data, error } = await supabase.from("date_plans").delete().eq("id", Number(latestDatePlan.id)).select("id");
    if (error) { console.error("DELETE DATE PLAN ERROR:", error.message); alert(error.message); return; }
    if (!data || data.length === 0) { alert(t("chat.date_plan.error_cancel_blocked")); return; }
    setLatestDatePlan(null);
    setIsEditingDatePlan(false);
    setShowDatePlanModal(false);
    setDatePlannedFor(""); setDatePlace(""); setDateNotes(""); setDateContactName(""); setDateContactPhone(""); setDateContactEmail("");
  }

  if (loading) {
    return (
      <main className="h-screen flex items-center justify-center">
        <p>{t("common.loading")}</p>
      </main>
    );
  }

  // ── render ───────────────────────────────────────────────────────────────────

  const activeMsg = activeMessageId ? messages.find((m) => m.id === activeMessageId) : null;

  // The last message I sent that the other person has read past
  const seenMessageId = (() => {
    if (!otherLastReadAt || !myUserId) return null;
    const readTime = new Date(otherLastReadAt).getTime();
    const candidates = messages.filter(
      (m) => m.sender_id === myUserId && new Date(m.created_at).getTime() <= readTime
    );
    return candidates.length > 0 ? candidates[candidates.length - 1].id : null;
  })();

  return (
    <main className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white px-6 py-4 flex items-center gap-3">
        <img src="/brand/icononly_transparent_nobuffer.png" alt="Unseen" className="h-8 w-auto object-contain" />
        <h1 className="text-xl font-bold flex-1">{label}</h1>

        {/* Match emoji picker */}
        <div className="relative">
          <button type="button" onClick={() => setShowEmojiMenu((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDE8EF] text-xl leading-none text-neutral-600">
            {emoji ?? "＋"}
          </button>
          {showEmojiMenu && (
            <div className="absolute right-0 top-12 z-20 w-64 rounded-2xl bg-white shadow-lg border border-[#EDE3DA] p-3 max-h-72 overflow-y-auto">
              {EMOJI_GROUPS.map((group) => (
                <div key={group.label} className="mb-2">
                  <p className="text-[10px] font-semibold text-[#A89488] uppercase tracking-wider mb-1 px-1">{group.label}</p>
                  <div className="grid grid-cols-6 gap-0.5">
                    {group.emojis.map((e) => (
                      <button key={e} type="button" onClick={() => saveEmoji(e)}
                        className="flex items-center justify-center h-9 w-9 rounded-xl text-xl active:bg-[#FAF3EE] transition">{e}</button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="border-t border-[#EDE3DA] mt-1 pt-2">
                <button type="button" onClick={() => saveEmoji(null)}
                  className="w-full py-1.5 text-xs text-[#E0175C] active:bg-[#FAF3EE] rounded-xl transition">
                  {t("chat.clear_emoji")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ⋯ menu */}
        <div className="relative">
          <button type="button" onClick={() => setShowMenu((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDE8EF] text-xl text-neutral-600">
            ⋯
          </button>
          {showMenu && (
            <div className="absolute right-0 top-12 z-20 w-48 rounded-xl bg-white shadow-xl border border-neutral-200 py-2">
              <button onClick={() => { setShowMenu(false); setShowUnmatchModal(true); }}
                className="w-full px-4 py-2 text-left hover:bg-neutral-100">{t("chat.unmatch")}</button>
              <button onClick={() => { setShowMenu(false); setShowReportModal(true); }}
                className="w-full px-4 py-2 text-left hover:bg-neutral-100">{t("chat.report")}</button>
              <button onClick={() => {
                setShowMenu(false);
                if (latestDatePlan) { openEditDatePlan(); }
                else { setIsEditingDatePlan(false); setDatePlannedFor(""); setDatePlace(""); setDateNotes(""); setDateContactName(""); setDateContactPhone(""); setDateContactEmail(""); setShowDatePlanModal(true); }
              }} className="w-full px-4 py-2 text-left hover:bg-neutral-100">
                {latestDatePlan ? t("chat.edit_date_plan") : t("chat.plan_a_date")}
              </button>
            </div>
          )}
        </div>

        <button onClick={() => router.push("/matches")} className="text-lg text-neutral-500">✕</button>
      </div>

      {/* Date plan modal */}
      {showDatePlanModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{isEditingDatePlan ? t("chat.date_plan.heading_edit") : t("chat.date_plan.heading_create")}</h2>
              <button type="button" onClick={() => { setShowDatePlanModal(false); setIsEditingDatePlan(false); }} className="text-lg text-neutral-500">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-600 mb-2">{t("chat.date_plan.date_time")}</label>
                <input type="datetime-local" value={datePlannedFor} onChange={(e) => setDatePlannedFor(e.target.value)} className="w-full rounded-xl border border-neutral-200 px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">{t("chat.date_plan.place")}</label>
                <input value={datePlace} onChange={(e) => setDatePlace(e.target.value)} placeholder={t("chat.date_plan.place_placeholder")} className="w-full rounded-xl border border-neutral-200 px-4 py-3" />
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => { const q = encodeURIComponent(datePlace.trim()); if (!q) return; window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank"); }}
                    className="rounded-full bg-[#FDE8EF] px-4 py-2 text-sm text-black">{t("chat.date_plan.open_maps")}</button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">{t("chat.date_plan.notes")}</label>
                <textarea value={dateNotes} onChange={(e) => setDateNotes(e.target.value)} placeholder={t("chat.date_plan.optional_details")} className="w-full rounded-xl border border-neutral-200 px-4 py-3 min-h-[90px] resize-none" />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">{t("chat.date_plan.contact_name")}</label>
                <input value={dateContactName} onChange={(e) => setDateContactName(e.target.value)} className="w-full rounded-xl border border-neutral-200 px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">{t("chat.date_plan.contact_phone")}</label>
                <input value={dateContactPhone} onChange={(e) => setDateContactPhone(e.target.value)} className="w-full rounded-xl border border-neutral-200 px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">{t("chat.date_plan.contact_email")}</label>
                <input value={dateContactEmail} onChange={(e) => setDateContactEmail(e.target.value)} className="w-full rounded-xl border border-neutral-200 px-4 py-3" />
              </div>
              <div className="flex gap-3 pt-2">
                {isEditingDatePlan && latestDatePlan && (
                  <button type="button" onClick={cancelDatePlan} className="rounded-full border border-neutral-200 px-4 py-3 text-red-500">{t("chat.date_plan.cancel_date")}</button>
                )}
                <button type="button" onClick={() => { setShowDatePlanModal(false); setIsEditingDatePlan(false); }} className="flex-1 rounded-full border border-neutral-200 px-4 py-3">{t("common.close")}</button>
                <button type="button" onClick={saveDatePlan} className="flex-1 rounded-full bg-[#E0175C] px-4 py-3 text-white">{isEditingDatePlan ? t("common.update") : t("common.save")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message list */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        onClick={() => { setActiveMessageId(null); setShowEmojiMenu(false); setShowMenu(false); }}
      >
        {/* Date plan card */}
        {latestDatePlan && (
          <div className="rounded-2xl bg-[#FDE8EF] p-4 space-y-2 mb-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-black">{t("chat.date_card.title")}</div>
              <div className="text-xs text-neutral-600">{t("chat.date_card.checkin_after", { n: latestDatePlan.check_in_after_minutes })}</div>
            </div>
            <div className="text-sm text-black">{new Date(latestDatePlan.planned_for).toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
            <div className="text-sm text-black">{latestDatePlan.place}</div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => { const q = encodeURIComponent(latestDatePlan.place); if (!q) return; window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank"); }}
                className="rounded-full bg-white px-3 py-1 text-xs border border-neutral-200">{t("chat.date_card.open_maps")}</button>
              <button type="button" onClick={openEditDatePlan} className="rounded-full bg-white px-3 py-1 text-xs border border-neutral-200">{t("chat.date_card.edit")}</button>
              <button type="button" onClick={cancelDatePlan} className="rounded-full bg-white px-3 py-1 text-xs border border-neutral-200 text-red-500">{t("chat.date_card.cancel_date")}</button>
            </div>
            {latestDatePlan.notes && <div className="text-sm text-neutral-700">{latestDatePlan.notes}</div>}
            {(latestDatePlan.emergency_contact_name || latestDatePlan.emergency_contact_phone || latestDatePlan.emergency_contact_email) && (
              <div className="pt-1 text-xs text-neutral-700 space-y-1">
                <div className="font-medium text-neutral-800">{t("chat.date_card.emergency_contact")}</div>
                {latestDatePlan.emergency_contact_name && <div>{latestDatePlan.emergency_contact_name}</div>}
                {latestDatePlan.emergency_contact_phone && <div>{latestDatePlan.emergency_contact_phone}</div>}
                {latestDatePlan.emergency_contact_email && <div>{latestDatePlan.emergency_contact_email}</div>}
              </div>
            )}
          </div>
        )}

        {messages.length === 0 ? (
          <p className="text-neutral-500 px-2">{t("chat.no_messages")}</p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === myUserId;
            const msgReactions = reactionsFor(m.id);
            const grouped = groupedReactions(msgReactions);
            const quotedMsg = m.reply_to_id ? messages.find((x) => x.id === m.reply_to_id) : null;

            return (
              <div key={m.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"} mb-1`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 select-none cursor-pointer ${
                      isMine ? "bg-[#E0175C] text-white" : "bg-[#FDE8EF] text-black"
                    } ${activeMessageId === m.id ? "opacity-80" : ""}`}
                    onTouchStart={() => handleMsgTouchStart(m.id)}
                    onTouchEnd={handleMsgTouchEnd}
                    onTouchMove={handleMsgTouchEnd}
                    onClick={(e) => { e.stopPropagation(); setActiveMessageId((prev) => prev === m.id ? null : m.id); }}
                  >
                    {/* Quoted message */}
                    {quotedMsg && (
                      <div className={`mb-2 rounded-xl px-3 py-2 text-xs border-l-2 ${isMine ? "border-white/60 bg-white/20 text-white/80" : "border-[#E0175C]/50 bg-[#E0175C]/10 text-[#6B5A52]"}`}>
                        {quotedMsg.content.length > 70 ? quotedMsg.content.slice(0, 70) + "…" : quotedMsg.content}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm">{m.content}</span>
                      <span className="text-[11px] opacity-50 mt-1">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>

                {/* Reaction chips — overlap bottom corner of bubble */}
                {grouped.length > 0 && (
                  <div className={`flex flex-wrap gap-0.5 -mt-3 relative z-10 ${isMine ? "justify-end pr-3" : "justify-start pl-3"}`}>
                    {grouped.map((g) => {
                      const iReacted = g.users.includes(myUserId);
                      return (
                        <button
                          key={g.emoji}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleReaction(m.id, g.emoji); }}
                          className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-sm shadow-sm transition-colors ${
                            iReacted ? "bg-[#FDE8EF]" : "bg-white"
                          }`}
                        >
                          <span>{g.emoji}</span>
                          {g.users.length > 1 && <span className="text-xs font-medium text-neutral-500">{g.users.length}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Seen receipt — only on the last message the other person has read */}
                {isMine && m.id === seenMessageId && (
                  <p className="text-[11px] text-[#A89488] pr-1 mt-0.5">{t("chat.seen")}</p>
                )}
              </div>
            );
          })
        )}
        {/* Typing indicator */}
        {otherIsTyping && (
          <div className="flex items-end gap-1 mb-1">
            <div className="rounded-2xl bg-[#FDE8EF] px-4 py-3 flex gap-1 items-center">
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#E0175C]" style={{ animationDelay: "0ms" }} />
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#E0175C]" style={{ animationDelay: "160ms" }} />
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#E0175C]" style={{ animationDelay: "320ms" }} />
            </div>
            <style>{`
              @keyframes typing-bounce {
                0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                30%            { transform: translateY(-5px); opacity: 1; }
              }
              .typing-dot { animation: typing-bounce 1.1s ease-in-out infinite; }
            `}</style>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Bottom input area */}
      {isUnmatched ? (
        <div className="sticky bottom-0 bg-[#FAF3EE] border-t border-[#EDE3DA] px-6 py-4 text-center">
          <p className="text-sm font-medium text-[#6B5A52]">{t("chat.conversation_ended")}</p>
          <p className="text-xs text-[#A89488] mt-0.5">{t("chat.conversation_ended_sub")}</p>
        </div>
      ) : (
        <div className="sticky bottom-0 bg-white">
          {blockedWarning && (
            <div className="flex items-start gap-3 bg-[#FFF3CD] border-t border-[#FFDFA0] px-5 py-3">
              <span className="text-lg leading-none mt-0.5">🚫</span>
              <p className="flex-1 text-sm text-[#5A4500]">{blockedWarning}</p>
              <button type="button" onClick={() => setBlockedWarning(null)} className="text-[#5A4500] opacity-60 hover:opacity-100 text-lg leading-none" aria-label="Dismiss">✕</button>
            </div>
          )}

          {/* Icebreaker chips — shown only before the first message */}
          {messages.length === 0 && icebreakers.length > 0 && (
            <div
              className="overflow-x-auto flex gap-2 px-4 py-2 border-t border-[#EDE3DA]"
              style={{ scrollbarWidth: "none" }}
            >
              {icebreakers.map((q) => (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => {
                    setNewMessage(t(`icebreaker.q.${q.key}`));
                    inputRef.current?.focus();
                  }}
                  className="flex-shrink-0 rounded-full border border-[#E0175C] bg-[#FDE8EF] px-4 py-2 text-sm font-semibold text-[#E0175C]"
                  style={{ fontFamily: "Nunito, sans-serif", whiteSpace: "nowrap" }}
                >
                  {t(`icebreaker.q.${q.key}`)}
                </button>
              ))}
            </div>
          )}

          {/* Reply context bar */}
          {replyTo && (
            <div className="flex items-center gap-3 bg-[#FAF3EE] border-t border-[#EDE3DA] px-5 py-2">
              <span className="text-[#E0175C] text-sm">↩</span>
              <p className="flex-1 text-sm text-[#6B5A52] truncate">{replyTo.content.length > 60 ? replyTo.content.slice(0, 60) + "…" : replyTo.content}</p>
              <button type="button" onClick={() => setReplyTo(null)} className="text-[#A89488] hover:text-[#E0175C] text-lg leading-none" aria-label="Cancel reply">✕</button>
            </div>
          )}

          <div className="px-4 py-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={t("chat.write_message")}
                className="flex-1 rounded-full border border-[#EDE3DA] px-4 py-3 text-sm focus:outline-none focus:border-[#E0175C] transition-colors"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } }}
              />
              <button onClick={sendMessage} disabled={sending}
                className="px-5 py-3 rounded-full bg-[#E0175C] text-white text-sm disabled:opacity-50">
                {sending ? t("chat.sending") : t("chat.send")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message action sheet (long-press) */}
      {activeMsg && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center"
          onClick={() => setActiveMessageId(null)}
        >
          <div
            className="w-full max-w-sm mx-4 mb-6 rounded-2xl bg-white shadow-2xl border border-[#EDE3DA] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview of the message */}
            <div className="px-5 py-3 border-b border-[#EDE3DA] bg-[#FAF3EE]">
              <p className="text-sm text-[#6B5A52] truncate">{activeMsg.content.length > 60 ? activeMsg.content.slice(0, 60) + "…" : activeMsg.content}</p>
            </div>

            {/* Quick reactions */}
            <div className="flex justify-around items-center px-4 py-4">
              {QUICK_REACTIONS.map((qe) => {
                const myReaction = reactions.find((r) => r.message_id === activeMsg.id && r.user_id === myUserId);
                const isActive = myReaction?.emoji === qe;
                return (
                  <button
                    key={qe}
                    type="button"
                    onClick={() => toggleReaction(activeMsg.id, qe)}
                    className={`flex flex-col items-center gap-0.5 rounded-xl p-2 transition-colors ${isActive ? "bg-[#FDE8EF]" : "active:bg-[#FAF3EE]"}`}
                  >
                    <span className="text-2xl">{qe}</span>
                  </button>
                );
              })}
            </div>

            {/* Reply button */}
            <div className="border-t border-[#EDE3DA]">
              <button
                type="button"
                onClick={() => { setReplyTo(activeMsg); setActiveMessageId(null); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="w-full px-5 py-3.5 text-left text-sm text-[#1C1410] flex items-center gap-3 active:bg-[#FAF3EE] transition-colors"
              >
                <span className="text-base">↩</span>
                <span>{t("chat.reply")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unmatch modal */}
      {showUnmatchModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t("chat.unmatch.heading")}</h2>
              <button type="button" onClick={() => setShowUnmatchModal(false)} className="text-lg text-neutral-500">✕</button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">{t("chat.unmatch.body")}</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowUnmatchModal(false)} className="flex-1 rounded-full border border-neutral-200 px-4 py-3">{t("common.cancel")}</button>
                <button type="button" onClick={async () => { setShowUnmatchModal(false); await unmatchConversation(); }} className="flex-1 rounded-full bg-[#E0175C] px-4 py-3 text-white">{t("chat.unmatch")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t("chat.report.heading")}</h2>
              <button type="button" onClick={() => setShowReportModal(false)} className="text-lg text-neutral-500">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-600 mb-2">{t("chat.report.reason_label")}</label>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full rounded-xl border border-neutral-200 px-4 py-3">
                  <option value="Inappropriate messages">{t("chat.report.reason_inappropriate")}</option>
                  <option value="Harassment">{t("chat.report.reason_harassment")}</option>
                  <option value="Fake profile">{t("chat.report.reason_fake")}</option>
                  <option value="Other">{t("chat.report.reason_other")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-2">{t("chat.report.details_label")}</label>
                <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder={t("chat.report.optional_details")} className="w-full rounded-xl border border-neutral-200 px-4 py-3 min-h-[100px] resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 rounded-full border border-neutral-200 px-4 py-3">{t("common.cancel")}</button>
                <button type="button" onClick={submitReport} className="flex-1 rounded-full bg-[#E0175C] px-4 py-3 text-white">{t("common.submit")}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
