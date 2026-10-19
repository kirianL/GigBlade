"use client";

import { useEffect, useState } from "react";

import type { CaptchaTheme } from "@/domain/captcha-host";
import { TurnstileWidget } from "@/lib/tenant/templates/turnstile-widget";

export function CaptchaClient({ theme }: { theme: CaptchaTheme }) {
  const [widgetKey, setWidgetKey] = useState(0);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== window.parent) return;
      const data = event.data as { source?: unknown; event?: unknown } | null;
      if (!data || data.source !== "gigblade-turnstile-host" || data.event !== "reset") {
        return;
      }
      setWidgetKey((key) => key + 1);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function post(event: "token" | "expire" | "error", token?: string) {
    if (window.parent === window) return;
    window.parent.postMessage(
      { source: "gigblade-turnstile", event, token },
      "*",
    );
  }

  return (
    <>
      <style>{`
        html, body {
          background: transparent !important;
          min-height: 0 !important;
        }
        body {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          overflow: hidden;
        }
      `}</style>
      <TurnstileWidget
        key={widgetKey}
        bare
        theme={theme}
        onSuccess={(token) => post("token", token)}
        onExpire={() => post("expire")}
        onError={() => post("error")}
      />
    </>
  );
}
