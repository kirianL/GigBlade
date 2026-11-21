"use client";

import { useEffect, useState } from "react";
import { mixCoverUrl, type SiteMix } from "@/domain/site-mixes";

type MixCoverProps = {
  mix: SiteMix;
  fallbackSrc: string;
};

export function MixCover({ mix, fallbackSrc }: MixCoverProps) {
  const baseSrc = mixCoverUrl(mix) ?? fallbackSrc;
  const [resolved, setResolved] = useState<{ url: string; src: string } | null>(null);
  const src = resolved?.url === mix.url ? resolved.src : baseSrc;

  useEffect(() => {
    if (mix.platform !== "soundcloud") return;

    const controller = new AbortController();
    void fetch(`/api/mix-cover?url=${encodeURIComponent(mix.url)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { thumbnailUrl?: string | null } | null) => {
        if (typeof body?.thumbnailUrl === "string" && body.thumbnailUrl) {
          setResolved({ url: mix.url, src: body.thumbnailUrl });
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [mix.platform, mix.url]);

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      onError={() => {
        if (src !== fallbackSrc) {
          setResolved({ url: mix.url, src: fallbackSrc });
        }
      }}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04]"
    />
  );
}
