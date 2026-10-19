import type { Metadata } from "next";

import { parseCaptchaTheme } from "@/domain/captcha-host";

import { CaptchaClient } from "./captcha-client";

export const metadata: Metadata = {
  title: "Verificación",
  robots: { index: false, follow: false },
};

export default async function CaptchaPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}) {
  const params = await searchParams;
  return <CaptchaClient theme={parseCaptchaTheme(params.theme)} />;
}
