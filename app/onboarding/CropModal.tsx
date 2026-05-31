"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "../../lib/i18n/I18nProvider";

// Swipe card is 3:4 — crop to match exactly.
const CROP_W = 360;
const CROP_H = 480;

interface Props {
  file: File;
  onConfirm: (cropped: File) => void;
  onCancel: () => void;
}

export default function CropModal({ file, onConfirm, onCancel }: Props) {
  const t = useT();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [imgSrc, setImgSrc] = useState("");

  // All position/scale values live in 360×480 logical coordinate space.
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scale, setScale] = useState(1);
  const [naturalW, setNaturalW] = useState(1);
  const [naturalH, setNaturalH] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [displayScale, setDisplayScale] = useState(1);

  // Latest values accessible from non-reactive event listeners (wheel, touch)
  const latest = useRef({ offsetX, offsetY, scale, naturalW, naturalH, displayScale });
  useEffect(() => {
    latest.current = { offsetX, offsetY, scale, naturalW, naturalH, displayScale };
  });

  const drag = useRef<{ startX: number; startY: number; startOX: number; startOY: number } | null>(null);
  const pinch = useRef<{ dist: number; scale: number } | null>(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Recompute display scale on mount and resize
  useEffect(() => {
    function measure() {
      const available = window.innerWidth - 32;
      setDisplayScale(available < CROP_W ? available / CROP_W : 1);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Non-passive wheel listener — React's onWheel is passive in some builds
  // and can't call preventDefault(), causing the page to scroll.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { offsetX: ox, offsetY: oy, scale: s, naturalW: nw, naturalH: nh } = latest.current;
      const minS = Math.max(CROP_W / nw, CROP_H / nh);
      const newS = Math.max(minS, Math.min(4, s - e.deltaY * 0.001));
      const imgW = nw * newS;
      const imgH = nh * newS;
      setScale(newS);
      setOffsetX(Math.max(Math.min(0, CROP_W - imgW), Math.min(0, ox)));
      setOffsetY(Math.max(Math.min(0, CROP_H - imgH), Math.min(0, oy)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Fit image so the shorter side fills the crop frame (object-cover style)
  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    setNaturalW(nw);
    setNaturalH(nh);
    const s = Math.max(CROP_W / nw, CROP_H / nh);
    setScale(s);
    setOffsetX((CROP_W - nw * s) / 2);
    setOffsetY((CROP_H - nh * s) / 2);
  }

  function clamp(ox: number, oy: number, s: number) {
    const imgW = naturalW * s;
    const imgH = naturalH * s;
    return {
      x: Math.max(Math.min(0, CROP_W - imgW), Math.min(0, ox)),
      y: Math.max(Math.min(0, CROP_H - imgH), Math.min(0, oy)),
    };
  }

  // Convert viewport clientX/Y → logical 360×480 crop coords.
  // Uses getBoundingClientRect() which accounts for the CSS scale transform.
  function toLogical(clientX: number, clientY: number, el: Element) {
    const rect = el.getBoundingClientRect();
    return {
      lx: (clientX - rect.left) / displayScale,
      ly: (clientY - rect.top) / displayScale,
    };
  }

  // ── Mouse drag ───────────────────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    const { lx, ly } = toLogical(e.clientX, e.clientY, e.currentTarget);
    drag.current = { startX: lx, startY: ly, startOX: offsetX, startOY: offsetY };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!drag.current) return;
    const { lx, ly } = toLogical(e.clientX, e.clientY, e.currentTarget);
    const { x, y } = clamp(
      drag.current.startOX + lx - drag.current.startX,
      drag.current.startOY + ly - drag.current.startY,
      scale
    );
    setOffsetX(x);
    setOffsetY(y);
  }
  function onMouseUp() { drag.current = null; }

  // ── Touch drag + pinch ───────────────────────────────────────────────────────
  // touch-action: none on the frame div tells the browser not to scroll/zoom,
  // so we don't need e.preventDefault() (which would fail on passive listeners).
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      const { lx, ly } = toLogical(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
      drag.current = { startX: lx, startY: ly, startOX: offsetX, startOY: offsetY };
    } else if (e.touches.length === 2) {
      drag.current = null;
      const dist = Math.hypot(
        (e.touches[0].clientX - e.touches[1].clientX) / displayScale,
        (e.touches[0].clientY - e.touches[1].clientY) / displayScale,
      );
      pinch.current = { dist, scale };
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 1 && drag.current) {
      const { lx, ly } = toLogical(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
      const { x, y } = clamp(
        drag.current.startOX + lx - drag.current.startX,
        drag.current.startOY + ly - drag.current.startY,
        scale
      );
      setOffsetX(x);
      setOffsetY(y);
    } else if (e.touches.length === 2 && pinch.current) {
      const dist = Math.hypot(
        (e.touches[0].clientX - e.touches[1].clientX) / displayScale,
        (e.touches[0].clientY - e.touches[1].clientY) / displayScale,
      );
      const minS = Math.max(CROP_W / naturalW, CROP_H / naturalH);
      const newS = Math.max(minS, Math.min(4, pinch.current.scale * (dist / pinch.current.dist)));
      const { x, y } = clamp(offsetX, offsetY, newS);
      setScale(newS);
      setOffsetX(x);
      setOffsetY(y);
    }
  }
  function onTouchEnd() { drag.current = null; pinch.current = null; }

  // ── Confirm: canvas crop in logical 360×480 space ───────────────────────────
  async function confirm() {
    setConfirming(true);
    const canvas = document.createElement("canvas");
    canvas.width = CROP_W;
    canvas.height = CROP_H;
    const ctx = canvas.getContext("2d");
    if (!ctx || !imgRef.current) { setConfirming(false); return; }
    ctx.drawImage(imgRef.current, offsetX, offsetY, naturalW * scale, naturalH * scale);
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(new File([blob], "photo.jpg", { type: "image/jpeg" }));
        setConfirming(false);
      },
      "image/jpeg",
      0.88
    );
  }

  const visualW = CROP_W * displayScale;
  const visualH = CROP_H * displayScale;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl overflow-hidden shadow-xl" style={{ width: visualW }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <button type="button" onClick={onCancel} className="text-sm text-[#A89488]">
            {t("common.cancel")}
          </button>
          <p className="text-sm font-semibold text-[#1C1410]">{t("photos.crop_heading")}</p>
          <button
            type="button"
            onClick={confirm}
            disabled={confirming || !imgSrc}
            className="text-sm font-semibold text-[#E0175C] disabled:opacity-50"
          >
            {confirming ? "…" : t("photos.crop_confirm")}
          </button>
        </div>

        {/* Crop frame — inner div is always 360×480 in DOM space;
            CSS scale maps it to the available screen width so the ratio
            is always exactly 3:4. touch-action:none prevents the browser
            from intercepting touch events for scroll/zoom. */}
        <div style={{ width: visualW, height: visualH, overflow: "hidden", position: "relative" }}>
          <div
            ref={frameRef}
            style={{
              width: CROP_W,
              height: CROP_H,
              transform: `scale(${displayScale})`,
              transformOrigin: "top left",
              overflow: "hidden",
              cursor: "grab",
              userSelect: "none",
              touchAction: "none",
              position: "absolute",
              top: 0,
              left: 0,
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {imgSrc && (
              <img
                ref={imgRef}
                src={imgSrc}
                alt="crop preview"
                onLoad={handleLoad}
                draggable={false}
                style={{
                  position: "absolute",
                  left: offsetX,
                  top: offsetY,
                  width: naturalW * scale,
                  height: naturalH * scale,
                  maxWidth: "none",   // override Tailwind preflight's img { max-width: 100% }
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            )}
            {/* Rule-of-thirds grid */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
                backgroundSize: `${CROP_W / 3}px ${CROP_H / 3}px`,
              }}
            />
          </div>
        </div>

        <p className="text-center text-xs text-[#A89488] py-3">
          {t("photos.crop_hint")}
        </p>
      </div>
    </div>
  );
}
