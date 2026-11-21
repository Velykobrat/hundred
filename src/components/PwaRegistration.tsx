"use client";

import { useEffect, useState } from "react";
import { usePreferences } from "../lib/use-preferences";

export default function PwaRegistration() {
  const { t } = usePreferences();
  const [updateReady, setUpdateReady] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    const inspect = () => {
      if (!disposed) setUpdateReady(Boolean(registration?.waiting && navigator.serviceWorker.controller));
    };
    const check = () => { if (navigator.onLine) void registration?.update().catch(() => {}); };
    const visible = () => { if (document.visibilityState === "visible") check(); };
    const found = () => { registration?.installing?.addEventListener("statechange", inspect); };
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then(result => {
      if (disposed) return;
      registration = result;
      inspect();
      found();
      registration.addEventListener("updatefound", found);
      check();
    }).catch(() => { /* Unsupported storage/network must not interrupt the local-first app. */ });
    const interval = window.setInterval(check, 60 * 60 * 1000);
    window.addEventListener("online", check);
    document.addEventListener("visibilitychange", visible);
    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.removeEventListener("online", check);
      document.removeEventListener("visibilitychange", visible);
      registration?.removeEventListener("updatefound", found);
      registration?.installing?.removeEventListener("statechange", inspect);
    };
  }, []);
  return updateReady ? <p role="status" className="save-status text-sm">{t("Доступне оновлення. Закрий усі вкладки й вікна Hundred та відкрий знову, щоб застосувати його.")}</p> : null;
}
