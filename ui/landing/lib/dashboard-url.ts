import { PLATFORM_DASHBOARD_ORIGIN } from "@/domain/hostname";

/** URL antigua del panel en Vercel; se reemplaza por el panel integrado en Next.js */
const LEGACY_DASHBOARD_URLS = new Set([
	"https://gig-blade.vercel.app",
	"http://gig-blade.vercel.app",
]);

function normalizeDashboardUrl(raw: string): string {
	let value = raw.trim().replace(/\/$/, "");
	if (!/^https?:\/\//i.test(value)) {
		value = `https://${value}`;
	}
	if (
		process.env.NODE_ENV === "production" &&
		LEGACY_DASHBOARD_URLS.has(value)
	) {
		return PLATFORM_DASHBOARD_ORIGIN;
	}
	return value;
}

export function getDashboardOrigin() {
	const raw = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim();
	if (raw && !raw.includes("localhost:3001")) {
		return normalizeDashboardUrl(raw);
	}
	if (process.env.NODE_ENV === "production") {
		return PLATFORM_DASHBOARD_ORIGIN;
	}
	return "";
}

export function getDashboardUrl() {
	const origin = getDashboardOrigin();
	return origin ? `${origin}/overview` : "/overview";
}

export function getDashboardSignInUrl() {
	const origin = getDashboardOrigin();
	return origin ? `${origin}/sign-in` : "/sign-in";
}
