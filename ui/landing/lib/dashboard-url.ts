export function getDashboardUrl() {
	const raw = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim();
	if (!raw) return "http://localhost:3001";
	const value = raw.replace(/\/$/, "");
	if (/^https?:\/\//i.test(value)) return value;
	return `https://${value}`;
}
