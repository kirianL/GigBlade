"use client";

import { useEffect } from "react";

export function SiteVisitBeacon() {
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch("/api/site-visit", {
        method: "POST",
        signal: controller.signal,
        keepalive: true,
      }).catch(() => undefined);
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return null;
}
