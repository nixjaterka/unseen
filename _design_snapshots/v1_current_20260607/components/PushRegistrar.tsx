"use client";

import { useEffect } from "react";

// Converts a base64url VAPID public key to a Uint8Array for the browser API.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushRegistrar() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) return;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    async function register() {
      try {
        // Register (or re-use) the service worker.
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

        // Don't ask for permission if already denied — would be silently ignored anyway.
        if (Notification.permission === "denied") return;

        // If already granted, just make sure the subscription is saved.
        if (Notification.permission === "granted") {
          await subscribe(reg, vapidKey!);
          return;
        }

        // Otherwise ask — browsers only allow this from a user gesture, but
        // calling it here works on most mobile browsers if the site is installed
        // as a PWA. We ask silently; the browser's native prompt will appear.
        const result = await Notification.requestPermission();
        if (result === "granted") {
          await subscribe(reg, vapidKey!);
        }
      } catch (err) {
        console.warn("[PushRegistrar]", err);
      }
    }

    async function subscribe(reg: ServiceWorkerRegistration, key: string) {
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key) as unknown as BufferSource,
        });
      }

      // Save to the server (upsert — safe to call multiple times).
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
    }

    register();
  }, []);

  return null;
}
