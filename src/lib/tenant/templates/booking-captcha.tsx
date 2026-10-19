"use client";

import { useEffect, useRef, useState } from "react";

import {
  isCaptchaFrameOrigin,
  readCaptchaFrameToken,
} from "@/domain/captcha-host";

function captchaFrameLocation(theme: "light" | "dark" | "auto"): { src: string; origin: string } {
  const query = `theme=${encodeURIComponent(theme)}`;
  if (process.env.NODE_ENV === "production") {
    const origin = "https://gigblades.com";
    return { origin, src: `${origin}/captcha?${query}` };
  }

  const { protocol, hostname, port } = window.location;
  const host =
    hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
  const origin = `${protocol}//${host}${port ? `:${port}` : ""}`;
  return { origin, src: `${origin}/captcha?${query}` };
}

export function BookingCaptcha({
  theme = "auto",
  resetKey = 0,
  onToken,
  onClear,
  onError,
}: {
  theme?: "light" | "dark" | "auto";
  resetKey?: number;
  onToken: (token: string) => void;
  onClear: () => void;
  onError: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frame, setFrame] = useState<{ src: string; origin: string } | null>(null);
  const onTokenRef = useRef(onToken);
  const onClearRef = useRef(onClear);
  const onErrorRef = useRef(onError);
  onTokenRef.current = onToken;
  onClearRef.current = onClear;
  onErrorRef.current = onError;

  useEffect(() => {
    setFrame(captchaFrameLocation(theme));
  }, [theme]);

  useEffect(() => {
    if (!frame) return;

    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (!isCaptchaFrameOrigin(event.origin, process.env.NODE_ENV === "production")) {
        return;
      }

      const token = readCaptchaFrameToken(event.data);
      if (token) {
        onTokenRef.current(token);
        return;
      }

      const data = event.data as { source?: unknown; event?: unknown } | null;
      if (!data || data.source !== "gigblade-turnstile") return;
      if (data.event === "expire" || data.event === "error") {
        onClearRef.current();
      }
      if (data.event === "error") onErrorRef.current();
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [frame]);

  useEffect(() => {
    if (!frame || resetKey === 0) return;
    iframeRef.current?.contentWindow?.postMessage(
      { source: "gigblade-turnstile-host", event: "reset" },
      frame.origin,
    );
    onClearRef.current();
  }, [resetKey, frame]);

  if (!frame) {
    return <div className="min-h-[70px] w-full" aria-hidden="true" />;
  }

  return (
    <iframe
      ref={iframeRef}
      src={frame.src}
      title="Verificación de seguridad"
      className="block h-[78px] w-full overflow-hidden border-0 bg-transparent"
    />
  );
}
