export function markdownTargetFor(pathname: string): string | null {
	const path = pathname.replace(/\/+$/, "") || "/";

	if (path === "/") return "/home.md";
	if (path === "/privacy") return "/privacy.md";
	if (path === "/terms") return "/terms.md";

	return null;
}
