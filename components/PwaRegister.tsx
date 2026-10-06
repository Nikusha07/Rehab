"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch(() => undefined);
      if ("caches" in window) {
        window.caches.keys()
          .then((keys) => Promise.all(keys.map((key) => window.caches.delete(key))))
          .catch(() => undefined);
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((error) => console.error("service worker registration failed", error));
  }, []);

  return null;
}
