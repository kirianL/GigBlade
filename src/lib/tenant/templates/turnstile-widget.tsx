"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: (error: unknown) => void;
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

const TEST_SITEKEY_PATTERN = /^[123]x0{18,}/;

export function configuredTurnstileSiteKey(): string | undefined {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!siteKey || TEST_SITEKEY_PATTERN.test(siteKey)) return undefined;
  return siteKey;
}

export type TurnstileWidgetProps = {
  onSuccess: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: "light" | "dark" | "auto";
  className?: string;
};

export function TurnstileWidget({
  onSuccess,
  onExpire,
  onError,
  theme = "auto",
  className = "",
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const siteKey = configuredTurnstileSiteKey();

  useEffect(() => {
    if (!siteKey) return;
    let isMounted = true;

    function renderWidget() {
      if (!isMounted || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return;

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey!,
          theme,
          size: "flexible",
          callback: (token: string) => {
            if (isMounted) onSuccess(token);
          },
          "expired-callback": () => {
            if (isMounted) onExpire?.();
          },
          "error-callback": () => {
            if (isMounted) {
              // In local dev fallback gracefully if turnstile fails
              if (process.env.NODE_ENV !== "production") {
                onSuccess("XXXX.DUMMY.TOKEN.XXXX");
              } else {
                onError?.();
              }
            }
          },
        });
        widgetIdRef.current = id;
        setLoaded(true);
      } catch {
        // Fallback gracefully in dev
        if (process.env.NODE_ENV !== "production") {
          onSuccess("XXXX.DUMMY.TOKEN.XXXX");
        }
      }
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.querySelector(
        'script[src*="challenges.cloudflare.com/turnstile"]',
      );
      if (!existingScript) {
        const script = document.createElement("script");
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = () => renderWidget();
        script.onerror = () => {
          if (process.env.NODE_ENV !== "production") {
            onSuccess("XXXX.DUMMY.TOKEN.XXXX");
          }
        };
        document.head.appendChild(script);
      } else {
        const checkInterval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkInterval);
            renderWidget();
          }
        }, 100);
        return () => clearInterval(checkInterval);
      }
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme, onSuccess, onExpire, onError]);

  if (!siteKey) return null;

  return (
    <div
      className={`min-h-[65px] flex items-center justify-center overflow-hidden rounded-xl bg-[var(--site-card-bg)] border border-[var(--site-card-border)]/60 p-2 transition-all ${className}`}
    >
      <div ref={containerRef} className="w-full flex justify-center" />
      {!loaded && (
        <span className="text-xs font-mono text-[var(--site-muted)] flex items-center gap-2 py-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500/80 animate-pulse" />
          Verificación segura de Cloudflare
        </span>
      )}
    </div>
  );
}
