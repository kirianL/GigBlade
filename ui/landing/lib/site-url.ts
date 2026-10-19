import { PLATFORM_MARKETING_ORIGIN } from "@/domain/hostname";

export function getSiteUrl() {
	const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
	if (explicit) return explicit;

	const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(
		/^https?:\/\//,
		"",
	);
	if (process.env.VERCEL_ENV === "production" && production) {
		return `https://${production}`;
	}

	const preview = process.env.VERCEL_URL;
	if (preview) return `https://${preview}`;

	return PLATFORM_MARKETING_ORIGIN;
}
