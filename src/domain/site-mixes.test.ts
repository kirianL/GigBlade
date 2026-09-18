import { describe, expect, it } from "vitest";

import {
  coerceSiteMixes,
  mixCoverUrl,
  readMixUrl,
  readSiteMixes,
  readSoundcloudArtworkFromHtml,
  readSoundcloudArtworkUrl,
  upgradeSoundcloudArtworkUrl,
} from "@/domain/site-mixes";

describe("site-mixes", () => {
  it("acepta un video de YouTube y un track de SoundCloud", () => {
    expect(readMixUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      title: "YouTube mix",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      platform: "youtube",
    });
    expect(
      readMixUrl("https://soundcloud.com/nox/after-hours-04"),
    ).toMatchObject({
      title: "after hours 04",
      url: "https://soundcloud.com/nox/after-hours-04",
      platform: "soundcloud",
    });
  });

  it("rechaza perfiles, http y hosts ajenos", () => {
    expect(readMixUrl("https://soundcloud.com/nox")).toBeUndefined();
    expect(readMixUrl("https://youtube.com/@nox")).toBeUndefined();
    expect(readMixUrl("http://youtube.com/watch?v=abc")).toBeUndefined();
    expect(readMixUrl("javascript:alert(1)")).toBeUndefined();
  });

  it("lee mixes sanitizados desde theme_config", () => {
    expect(
      readSiteMixes({
        mixes: [
          {
            title: "After hours 04",
            url: "https://soundcloud.com/nox/after-hours-04",
          },
          { url: "https://evil.example/watch?v=x" },
          { url: "https://youtu.be/dQw4w9WgXcQ" },
        ],
      }),
    ).toEqual([
      {
        title: "After hours 04",
        url: "https://soundcloud.com/nox/after-hours-04",
        platform: "soundcloud",
      },
      {
        title: "YouTube mix",
        url: "https://youtu.be/dQw4w9WgXcQ",
        platform: "youtube",
      },
    ]);
  });

  it("arma la portada de YouTube desde el id del video", () => {
    expect(
      mixCoverUrl({
        title: "Live",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        platform: "youtube",
      }),
    ).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(
      mixCoverUrl({
        title: "After",
        url: "https://soundcloud.com/nox/after-hours-04",
        platform: "soundcloud",
      }),
    ).toBeUndefined();
  });

  it("recorta a ocho mixes", () => {
    const mixes = Array.from({ length: 10 }, (_, index) => ({
      title: `Mix ${index}`,
      url: `https://soundcloud.com/nox/mix-${index}`,
    }));
    expect(coerceSiteMixes(mixes)).toHaveLength(8);
  });

  it("lee la portada original de SoundCloud desde og:image", () => {
    const html = `
      <meta property="og:image" content="https://i1.sndcdn.com/artworks-xuxZwjMQTWDAt1zH-IykTjQ-large.jpg">
      <img src="https://i1.sndcdn.com/avatars-abc-large.jpg">
    `;
    expect(readSoundcloudArtworkFromHtml(html)).toBe(
      "https://i1.sndcdn.com/artworks-xuxZwjMQTWDAt1zH-IykTjQ-t500x500.jpg",
    );
  });

  it("ignora waveforms y hosts ajenos en la portada de SoundCloud", () => {
    expect(
      readSoundcloudArtworkUrl("https://wave.sndcdn.com/abc.png"),
    ).toBeUndefined();
    expect(
      readSoundcloudArtworkUrl("http://i1.sndcdn.com/artworks-abc-t500x500.jpg"),
    ).toBeUndefined();
    expect(upgradeSoundcloudArtworkUrl("https://example.com/cover.jpg")).toBe(
      "https://example.com/cover.jpg",
    );
  });
});
