"use client";

import { useEffect, useState } from "react";
import { mixCoverUrl, type SiteMix } from "@/domain/site-mixes";

type MixCoverProps = {
  mix: SiteMix;
  fallbackSrc: string;
};

export function MixCover({ mix, fallbackSrc }: MixCoverProps) {
  const youtubeCover = mixCoverUrl(mix);
  const [src, setSrc] = useState(youtubeCover ?? fallbackSrc);

  useEffect(() => {
    setSrc(youtubeCover ?? fallbackSrc);
    if (mix.platform !== "soundcloud") return;

    const controller = new AbortController();
    void fetch(`/api/mix-cover?url=${encodeURIComponent(mix.url)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { thumbnailUrl?: string | null } | null) => {
        if (typeof body?.thumbnailUrl === "string" && body.thumbnailUrl) {
          setSrc(body.thumbnailUrl);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [fallbackSrc, mix.platform, mix.url, youtubeCover]);

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      onError={() => {
        if (src !== fallbackSrc) setSrc(fallbackSrc);
      }}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04]"
    />
  );
}
