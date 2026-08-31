"use client";

import { useRef, useState } from "react";

// Playback for one voice message.
//
// The bucket is private, so the URL is fetched lazily on first play and not
// before: rendering fifty bubbles must not mint fifty signed URLs. Signed
// URLs are short-lived, so a stale one is re-fetched rather than cached
// forever.

function formatDuration(ms: number | null): string {
  if (!ms || ms <= 0) return "0:00";
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default function VoiceBubble({
  messageId,
  durationMs,
  isMine,
  failedLabel,
}: {
  messageId: number;
  durationMs: number | null;
  isMine: boolean;
  failedLabel: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  async function toggle() {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    setFailed(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/audio?messageId=${messageId}`);
      const json = await res.json().catch(() => null);
      if (!json?.ok || !json.url) throw new Error("no url");

      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.src = json.url;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => { setFailed(true); setPlaying(false); };
      await audio.play();
      setPlaying(true);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  const tint = isMine ? "text-white" : "text-[#1C1410]";
  const ring = isMine ? "bg-white/25" : "bg-[#FDE8EF]";

  return (
    <div className="flex items-center gap-3 min-w-[168px]">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); void toggle(); }}
        aria-label={playing ? "Pause" : "Play"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ring} ${tint}`}
      >
        {loading ? (
          <span className="block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : playing ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* A fixed waveform: decorative only, it is not drawn from the audio. */}
      <div className="flex items-center gap-[3px] flex-1" aria-hidden>
        {[9, 15, 22, 13, 19, 26, 12, 17, 10, 20, 14, 8].map((h, i) => (
          <span
            key={i}
            style={{ height: `${h}px` }}
            className={`w-[3px] rounded-full ${isMine ? "bg-white/50" : "bg-[#E0175C]/35"}`}
          />
        ))}
      </div>

      <span className={`text-[11px] tabular-nums ${isMine ? "text-white/70" : "text-[#A89488]"}`}>
        {failed ? failedLabel : formatDuration(durationMs)}
      </span>
    </div>
  );
}
