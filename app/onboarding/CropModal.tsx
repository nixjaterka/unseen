"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "../../lib/i18n/I18nProvider";

// Swipe card uses 3:4 — crop to match exactly.
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
  const [imgSrc, setImgSrc] = useState("");

  // Image position/scale state — image moves inside the fixed crop frame
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [scale, setScale] = useState(1);
  const [naturalW, setNaturalW] = useState(1);
  const [naturalH, setNaturalH] = useState(1);
  const [confirming, setConfirming] = useState(false);

  // Drag state
  const drag = useRef<{ startX: number; startY: number; startOX: number; startOY: number } | null>(null);
  // Pinch state
  const pinch = useRef<{ dist: number; scale: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Once image loads, fit it so the shorter side fills the crop frame
  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    setNaturalW(nw);
    setNaturalH(nh);

    // Fit so image fills the frame (object-cover style)
    const scaleX = CROP_W / nw;
    const scaleY = CROP_H / nh;
    const s = Math.max(scaleX, scaleY);
    setScale(s);
    setOffsetX((CROP_W - nw * s) / 2);
    setOffsetY((CROP_H - nh * s) / 2);
  }

  // Clamp offset so image always covers the crop frame
  function clamp(ox: number, oy: number, s: number) {
    const imgW = naturalW * s;
    const imgH = naturalH * s;
    const minX = Math.min(0, CROP_W - imgW);
    const minY = Math.min(0, CROP_H - imgH);
    return {
      x: Math.max(minX, Math.min(0, ox)),
      y: Math.max(minY, Math.min(0, oy)),
    };
  }

  // ── Mouse drag ───────────────────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    drag.current = { startX: e.clientX, startY: e.clientY, startOX: offsetX, startOY: offsetY };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!drag.current) return;
    const { x, y } = clamp(
      drag.current.startOX + e.clientX - drag.current.startX,
      drag.current.startOY + e.clientY - drag.current.startY,
      scale
    );
    setOffsetX(x);
    setOffsetY(y);
  }
  function onMouseUp() { drag.current = null; }

  // ── Touch drag + pinch ───────────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 1) {
      drag.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, startOX: offsetX, startOY: offsetY };
    } else if (e.touches.length === 2) {
      drag.current = null;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinch.current = { dist, scale };
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 1 && drag.current) {
      const { x, y } = clamp(
        drag.current.startOX + e.touches[0].clientX - drag.current.startX,
        drag.current.startOY + e.touches[0].clientY - drag.current.startY,
        scale
      );
      setOffsetX(x);
      setOffsetY(y);
    } else if (e.touches.length === 2 && pinch.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const minScale = Math.max(CROP_W / naturalW, CROP_H / naturalH);
      const newScale = Math.max(minScale, Math.min(4, pinch.current.scale * (dist / pinch.current.dist)));
      const { x, y } = clamp(offsetX, offsetY, newScale);
      setScale(newScale);
      setOffsetX(x);
      setOffsetY(y);
    }
  }
  function onTouchEnd() { drag.current = null; pinch.current = null; }

  // ── Wheel zoom (desktop) ─────────────────────────────────────────────────────
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const minScale = Math.max(CROP_W / naturalW, CROP_H / naturalH);
    const newScale = Math.max(minScale, Math.min(4, scale - e.deltaY * 0.001));
    const { x, y } = clamp(offsetX, offsetY, newScale);
    setScale(newScale);
    setOffsetX(x);
    setOffsetY(y);
  }

  // ── Confirm: canvas crop ─────────────────────────────────────────────────────
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
      <div className="w-full max-w-sm mx-4 bg-[#1C1410] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <button type="button" onClick={onCancel} className="text-sm text-[#A89488]">
            {t("common.cancel")}
          </button>
          <p className="text-sm font-semibold text-white">{t("photos.crop_heading")}</p>
          <button
            type="button"
            onClick={confirm}
            disabled={confirming || !imgSrc}
            className="text-sm font-semibold text-[#E0175C] disabled:opacity-50"
          >
            {confirming ? "…" : t("photos.crop_confirm")}
          </button>
        </div>

        {/* Crop frame */}
        <div
          style={{ width: CROP_W, height: CROP_H, maxWidth: "100%" }}
          className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none mx-auto"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onWheel={onWheel}
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
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          )}
          {/* Subtle rule-of-thirds grid */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: `${CROP_W / 3}px ${CROP_H / 3}px`,
          }} />
        </div>

        <p className="text-center text-xs text-[#A89488] py-3">
          {t("photos.crop_hint")}
        </p>
      </div>
    </div>
  );
}
