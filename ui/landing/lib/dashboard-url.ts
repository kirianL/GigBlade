import {
	PLATFORM_DASHBOARD_ORIGIN,
} from "@/domain/hostname";

const LOCAL_DASHBOARD_URL = "http://localhost:3001";

/** URL antigua del panel en Vercel; se reemplaza por app.gigblades.com en producción */
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

export function getDashboardUrl() {
	const raw = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim();
	if (!raw) {
		return process.env.NODE_ENV === "production"
			? PLATFORM_DASHBOARD_ORIGIN
			: LOCAL_DASHBOARD_URL;
	}
	return normalizeDashboardUrl(raw);
}

export function getDashboardSignInUrl() {
	return `${getDashboardUrl()}/sign-in`;
}
