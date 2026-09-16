export function getDashboardUrl() {
	const fromEnv = process.env.NEXT_PUBLIC_DASHBOARD_URL?.replace(/\/$/, "");
	return fromEnv || "http://localhost:3001";
}
