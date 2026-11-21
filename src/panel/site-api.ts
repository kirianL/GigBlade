import { djPreviewOrigin, gigbladeMarketingSiteUrl } from "@/panel/concept";
import {
	clearPanelAuthSession,
	getPanelCsrfToken,
} from "@/panel/panel-session";

const FETCH_TIMEOUT_MS = 15_000;

export type PublicSiteProfile = {
	displayName: string;
	tagline: string;
	city: string;
	bio: string;
	email?: string;
	phone?: string;
	links: {
		instagram?: string;
		tiktok?: string;
		youtube?: string;
		facebook?: string;
		x?: string;
		soundcloud?: string;
		spotify?: string;
	};
	brandColor?: string;
	photos?: string[];
	heroPhoto?: string;
	heroPosition?: "center" | "top" | "bottom" | "left" | "right";
	heroStyle?: "cinematic" | "poster" | "band" | "type" | "duo";
	heroAlign?: "start" | "center";
	surfaceStyle?: "plain" | "gradient" | "bands" | "frame";
	agendaStyle?: "list" | "cards";
	bioStyle?: "quote" | "columns";
	mixStyle?: "grid" | "row" | "list";
	linkStyle?: "cards" | "icons";
	buttonStyle?: "pill" | "square" | "text";
	cornerStyle?: "round" | "sharp";
	titleStyle?: "tight" | "wide" | "spaced";
	backgroundPattern?: "none" | "dots" | "grid" | "diagonal" | "grain";
	events?: Array<{
		date: string;
		venue: string;
		location: string;
		ticketUrl?: string;
		photo?: string;
	}>;
	hiddenSections?: Array<
		"agenda" | "bio" | "enlaces" | "sets" | "contacto"
	>;
	mixes?: Array<{
		title: string;
		url: string;
		platform: "youtube" | "soundcloud";
	}>;
};

export type PublicSite = {
	slug: string;
	domain: string;
	templateId: "pista" | "festival" | "after";
	appearance: "light" | "dark" | "party";
	profile: PublicSiteProfile;
};

export type SiteContentPatch = {
	templateId: PublicSite["templateId"];
	displayName?: string;
	tagline?: string;
	city?: string;
	bio?: string;
	email?: string;
	phone?: string;
	brandColor?: string;
	photos?: string[];
	heroPosition?: PublicSiteProfile["heroPosition"];
	heroStyle?: PublicSiteProfile["heroStyle"];
	heroAlign?: PublicSiteProfile["heroAlign"];
	surfaceStyle?: PublicSiteProfile["surfaceStyle"];
	agendaStyle?: PublicSiteProfile["agendaStyle"];
	bioStyle?: PublicSiteProfile["bioStyle"];
	mixStyle?: PublicSiteProfile["mixStyle"];
	linkStyle?: PublicSiteProfile["linkStyle"];
	buttonStyle?: PublicSiteProfile["buttonStyle"];
	cornerStyle?: PublicSiteProfile["cornerStyle"];
	titleStyle?: PublicSiteProfile["titleStyle"];
	backgroundPattern?: PublicSiteProfile["backgroundPattern"];
	events?: PublicSiteProfile["events"];
	hiddenSections?: PublicSiteProfile["hiddenSections"];
	links?: PublicSiteProfile["links"];
	mixes?: Array<{
		title: string;
		url: string;
	}>;
};

async function readJson(response: Response) {
	return response.json().catch(() => null);
}

function withTimeout(parent?: AbortSignal, timeoutMs = FETCH_TIMEOUT_MS) {
	const controller = new AbortController();
	const timer = window.setTimeout(() => controller.abort(), timeoutMs);
	parent?.addEventListener("abort", () => controller.abort(), { once: true });
	return {
		signal: controller.signal,
		cancel: () => window.clearTimeout(timer),
	};
}

function tenantApi(slug: string, path = "/api/tenant") {
	const base = typeof window !== "undefined" ? window.location.origin : gigbladeMarketingSiteUrl();
	const url = new URL(path, `${base}/`);
	url.searchParams.set("slug", slug);
	return url.toString();
}

export function publicSiteAssetUrl(slug: string, url: string) {
	if (!url.startsWith("/")) return url;
	if (process.env.NODE_ENV === "production") return url;
	return `${djPreviewOrigin(slug)}${url}`;
}

function platformApiOrigin() {
	return "";
}

export type SiteVisitStats = {
	uniqueVisitors: number;
	month: string | null;
	lastVisitedAt: string | null;
	source?: "preview" | "cloudflare";
};

export type WaitlistSignup = {
	id: string;
	artistName: string;
	email: string;
	country: "CR" | "US";
	city: string | null;
	instagram: string | null;
	phone: string | null;
	note: string | null;
	meetingAt?: string | null;
	referralCode?: string | null;
	paymentStatus?: "unpaid" | "paid";
	paymentAmount?: number | null;
	paymentCurrency?: "USD" | "CRC" | null;
	tilopayOrderNumber?: string | null;
	tilopayTransactionId?: string | null;
	tilopayAuthCode?: string | null;
	paidAt?: string | null;
	status: "pending" | "contacted" | "onboarded" | "declined";
	createdAt: string;
};

export type PlatformSite = {
	slug: string;
	displayName: string;
	domain: string;
	preview: boolean;
	status: "active" | "suspended";
	visits: number;
	lastVisitedAt: string | null;
	email?: string;
};

export type SiteHealthLevel = "ok" | "warn" | "critical";

export type SiteHealthCheck = {
	id: string;
	level: SiteHealthLevel;
	label: string;
	detail: string;
};

export type PlatformSiteAudit = {
	slug: string;
	displayName: string;
	domain: string;
	preview: boolean;
	tenantStatus: "active" | "suspended" | "canceled";
	routeStatus: "active" | "suspended" | "missing";
	overall: SiteHealthLevel;
	checks: SiteHealthCheck[];
	checkedAt: string;
};

export type PlatformSiteAuditReport = {
	checkedAt: string;
	totals: Record<SiteHealthLevel, number>;
	sites: PlatformSiteAudit[];
};

const siteCache = new Map<string, { site: PublicSite; expiresAt: number }>();

export async function fetchPublicSite(
	slug: string,
	signal?: AbortSignal,
): Promise<PublicSite | null> {
	const cached = siteCache.get(slug);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.site;
	}
	const timeout = withTimeout(signal);
	try {
		const response = await fetch(tenantApi(slug), {
			signal: timeout.signal,
		});
		if (!response.ok) return null;
		const site = (await readJson(response)) as PublicSite;
		siteCache.set(slug, { site, expiresAt: Date.now() + 15_000 });
		return site;
	} catch {
		return null;
	} finally {
		timeout.cancel();
	}
}

const MUTABLE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function withCsrfHeader(method: string | undefined, headers: Headers) {
	if (!MUTABLE_METHODS.has((method ?? "GET").toUpperCase())) return;
	const csrf = getPanelCsrfToken();
	if (csrf) {
		headers.set("x-panel-csrf", csrf);
	}
}

export async function savePublicSite(
	slug: string,
	input: SiteContentPatch,
	signal?: AbortSignal,
): Promise<PublicSite> {
	const timeout = withTimeout(signal);
	try {
		const headers = new Headers({
			"content-type": "application/json",
		});
		withCsrfHeader("PATCH", headers);
		const response = await fetch(tenantApi(slug), {
			method: "PATCH",
			credentials: "include",
			headers,
			body: JSON.stringify(input),
			signal: timeout.signal,
		});
		const body = await readJson(response);
		if (!response.ok) {
			throw new Error(body?.message || "No se pudo publicar el contenido.");
		}
		const saved = body as PublicSite;
		siteCache.set(slug, { site: saved, expiresAt: Date.now() + 15_000 });
		return saved;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error("La API del sitio no respondió.");
		}
		if (error instanceof Error && error.name !== "TypeError") {
			throw error;
		}
		throw new Error("No se pudo publicar el contenido.");
	} finally {
		timeout.cancel();
	}
}

export async function fetchSiteVisits(
	slug: string,
	signal?: AbortSignal,
): Promise<SiteVisitStats | null> {
	const timeout = withTimeout(signal);
	try {
		const response = await fetch(tenantApi(slug, "/api/site-visit"), {
			signal: timeout.signal,
		});
		if (!response.ok) return null;
		const body = (await readJson(response)) as
			| (SiteVisitStats & { views?: number })
			| null;
		const uniqueVisitors =
			typeof body?.uniqueVisitors === "number"
				? body.uniqueVisitors
				: typeof body?.views === "number"
					? body.views
					: null;
		if (uniqueVisitors === null) return null;
		return {
			uniqueVisitors,
			month: typeof body?.month === "string" ? body.month : null,
			lastVisitedAt:
				typeof body?.lastVisitedAt === "string" ? body.lastVisitedAt : null,
			source: body?.source === "cloudflare" ? "cloudflare" : "preview",
		};
	} catch {
		return null;
	} finally {
		timeout.cancel();
	}
}

export type PlatformSiteHealthResult = {
	report: PlatformSiteAuditReport | null;
	error: string | null;
};

export async function fetchPlatformSiteHealth(
	signal?: AbortSignal,
): Promise<PlatformSiteHealthResult> {
	const timeout = withTimeout(signal, 30_000);
	try {
		const response = await fetch(
			`${platformApiOrigin()}/api/platform/site-health`,
			{
				credentials: "include",
				signal: timeout.signal,
			},
		);
		const body = (await readJson(response)) as
			| PlatformSiteAuditReport
			| { message?: string }
			| null;
		if (response.status === 401) {
			clearPanelAuthSession();
			return {
				report: null,
				error: "La sesión expiró. Entrá de nuevo.",
			};
		}
		if (!response.ok) {
			return {
				report: null,
				error:
					(body && "message" in body && typeof body.message === "string" && body.message) ||
					`La API respondió ${response.status}.`,
			};
		}
		if (!body || !Array.isArray((body as PlatformSiteAuditReport).sites)) {
			return {
				report: null,
				error: "La API devolvió una respuesta inválida.",
			};
		}
		return { report: body as PlatformSiteAuditReport, error: null };
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			return { report: null, error: "La auditoría tardó demasiado." };
		}
		return {
			report: null,
			error: "No se pudo contactar la API de GigBlades.",
		};
	} finally {
		timeout.cancel();
	}
}

export async function fetchPlatformWaitlist(
	signal?: AbortSignal,
): Promise<WaitlistSignup[]> {
	const timeout = withTimeout(signal);
	try {
		const response = await fetch(`${platformApiOrigin()}/api/platform/waitlist`, {
			credentials: "include",
			signal: timeout.signal,
		});
		const body = (await readJson(response)) as
			| { signups?: WaitlistSignup[]; message?: string }
			| null;
		if (response.status === 401) {
			clearPanelAuthSession();
			throw new Error("Volvé a entrar con la cuenta de plataforma.");
		}
		if (!response.ok || !Array.isArray(body?.signups)) {
			throw new Error(body?.message || "No se pudo cargar la lista de espera.");
		}
		return body.signups;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error("La API no respondió.");
		}
		if (error instanceof Error) throw error;
		throw new Error("No se pudo cargar la lista de espera.");
	} finally {
		timeout.cancel();
	}
}

function sessionRejected(message: string | undefined) {
	return !message?.includes("Solo la plataforma");
}

export async function fetchPlatformSites(
	signal?: AbortSignal,
): Promise<PlatformSite[]> {
	const timeout = withTimeout(signal);
	try {
		const response = await fetch(`${platformApiOrigin()}/api/platform/sites`, {
			credentials: "include",
			signal: timeout.signal,
		});
		const body = (await readJson(response)) as
			| { sites?: PlatformSite[]; message?: string }
			| null;
		if (response.status === 401) {
			if (sessionRejected(body?.message)) clearPanelAuthSession();
			throw new Error(
				body?.message || "Volvé a entrar con la cuenta de plataforma.",
			);
		}
		if (!response.ok) {
			throw new Error(body?.message || "No se pudieron cargar los DJs.");
		}
		if (!Array.isArray(body?.sites)) {
			throw new Error("No se pudieron cargar los DJs.");
		}
		return body.sites;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error("La API no respondió.");
		}
		if (error instanceof Error) throw error;
		throw new Error("No se pudieron cargar los DJs.");
	} finally {
		timeout.cancel();
	}
}

export type PanelUser = {
	email: string;
	name: string;
	role: "platform" | "dj";
	slug?: string;
};

export type PanelLoginResult = {
	user: PanelUser;
	csrfToken: string;
};

export type GeneratedDjPassword = {
	email: string;
	name: string;
	slug: string;
	password: string;
};

async function panelFetch(
	path: string,
	init: RequestInit & { timeoutMs?: number },
) {
	const timeout = withTimeout(undefined, init.timeoutMs);
	try {
		const headers = new Headers(init.headers);
		if (
			!headers.has("content-type") &&
			init.body &&
			!(init.body instanceof FormData)
		) {
			headers.set("content-type", "application/json");
		}
		withCsrfHeader(init.method, headers);
		const response = await fetch(`${platformApiOrigin()}${path}`, {
			...init,
			credentials: "include",
			headers,
			signal: timeout.signal,
		});
		const body = await readJson(response);
		if (!response.ok) {
			const error = new Error(
				(typeof body?.message === "string" && body.message) ||
					"No se pudo completar el acceso.",
			) as Error & { status: number };
			error.status = response.status;
			throw error;
		}
		return body;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(
				"La API del sitio no respondió.",
			);
		}
		throw error;
	} finally {
		timeout.cancel();
	}
}

export async function loginPanelAccount(input: {
	email: string;
	password: string;
}): Promise<PanelLoginResult> {
	const body = (await panelFetch("/api/panel/login", {
		method: "POST",
		body: JSON.stringify(input),
		timeoutMs: 8000,
	})) as Partial<PanelLoginResult>;
	if (!body?.user?.email || !body.csrfToken) {
		throw new Error("No se pudo entrar.");
	}
	return { user: body.user, csrfToken: body.csrfToken };
}

export async function readPanelCookieSession(): Promise<PanelLoginResult | null> {
	try {
		const body = (await panelFetch("/api/panel/session", {
			method: "GET",
			timeoutMs: 8000,
		})) as Partial<PanelLoginResult>;
		if (!body?.user?.email || !body.csrfToken) return null;
		return { user: body.user, csrfToken: body.csrfToken };
	} catch {
		return null;
	}
}

export async function clearRemotePanelSession(): Promise<void> {
	try {
		await panelFetch("/api/panel/session", {
			method: "DELETE",
			timeoutMs: 4000,
		});
	} catch {
		// ignore
	}
}

export async function generateDjPassword(input: {
	slug: string;
	email: string;
	name: string;
}): Promise<GeneratedDjPassword> {
	const body = (await panelFetch("/api/panel/password", {
		method: "POST",
		body: JSON.stringify({
			slug: input.slug,
			email: input.email,
			name: input.name,
		}),
		timeoutMs: 8000,
	})) as GeneratedDjPassword;
	if (!body?.password || !body.email) {
		throw new Error("No se pudo generar la contraseña.");
	}
	return body;
}

export async function deleteWaitlistSignup(input: {
	id: string;
}): Promise<{ id: string }> {
	const body = (await panelFetch(
		`/api/platform/waitlist?id=${encodeURIComponent(input.id)}`,
		{
			method: "DELETE",
			timeoutMs: 15000,
		},
	)) as { id?: string };
	if (!body?.id) {
		throw new Error("No se pudo eliminar la solicitud.");
	}
	return { id: body.id };
}

export async function deleteDj(input: {
	slug: string;
}): Promise<{ slug: string }> {
	const body = (await panelFetch(
		`/api/platform/sites?slug=${encodeURIComponent(input.slug)}`,
		{
			method: "DELETE",
			timeoutMs: 15000,
		},
	)) as { slug?: string };
	if (!body?.slug) {
		throw new Error("No se pudo eliminar el DJ.");
	}
	return { slug: body.slug };
}

export type CreatedDj = {
	slug: string;
	email: string;
	name: string;
	password: string;
	site: PlatformSite;
};

export async function createDj(input: {
	name: string;
	email: string;
	slug: string;
}): Promise<CreatedDj> {
	const body = (await panelFetch("/api/platform/sites", {
		method: "POST",
		body: JSON.stringify({
			name: input.name,
			email: input.email,
			slug: input.slug,
		}),
		timeoutMs: 15000,
	})) as Partial<CreatedDj>;
	if (!body?.slug || !body.password || !body.email || !body.site) {
		throw new Error("No se pudo crear el DJ.");
	}
	return body as CreatedDj;
}

export async function onboardWaitlistSignup(input: {
	id: string;
}): Promise<CreatedDj & { emailed: boolean }> {
	const body = (await panelFetch("/api/platform/waitlist", {
		method: "POST",
		body: JSON.stringify({ id: input.id }),
		timeoutMs: 15000,
	})) as Partial<CreatedDj & { emailed?: boolean }>;
	if (!body?.slug || !body.password || !body.email || !body.site) {
		throw new Error("No se pudo crear la página.");
	}
	return { ...(body as CreatedDj), emailed: body.emailed === true };
}

export async function uploadSitePhoto(input: {
	slug: string;
	file: File;
}): Promise<string> {
	const formData = new FormData();
	formData.set("slug", input.slug);
	formData.set("file", input.file);
	const body = (await panelFetch("/api/panel/site-photo", {
		method: "POST",
		body: formData,
		timeoutMs: 30000,
	})) as { url?: string };
	if (!body.url) throw new Error("No se pudo subir la foto.");
	return body.url;
}

export type PublicBooking = {
	id: string;
	tenantId: string;
	name: string;
	email: string;
	phone: string | null;
	eventType: "club" | "festival" | "private" | "wedding" | "corporate" | "other";
	city: string | null;
	eventDate: string | null;
	note: string | null;
	status: "pending" | "confirmed" | "declined";
	createdAt: string;
};

export async function fetchDjBookings(input: {
	slug: string;
	signal?: AbortSignal;
}): Promise<PublicBooking[]> {
	const body = (await panelFetch(
		`/api/panel/bookings?slug=${encodeURIComponent(input.slug)}`,
		{
			method: "GET",
			timeoutMs: 15000,
		},
	)) as { bookings?: PublicBooking[] };
	return body?.bookings ?? [];
}

export async function updateBookingStatus(input: {
	id: string;
	status: "pending" | "confirmed" | "declined";
	slug: string;
}): Promise<PublicBooking> {
	const body = (await panelFetch("/api/panel/bookings", {
		method: "PATCH",
		body: JSON.stringify({
			id: input.id,
			status: input.status,
			slug: input.slug,
		}),
		timeoutMs: 15000,
	})) as { booking?: PublicBooking };
	if (!body?.booking?.id) {
		throw new Error("No se pudo actualizar el estado de la contratación.");
	}
	return body.booking;
}

export type DomainProvider =
	| "godaddy"
	| "cloudflare"
	| "namecom"
	| "namecheap"
	| "google"
	| "vercel"
	| "other";

export type DomainProvisionStatus =
	| "active"
	| "pending_dns"
	| "verifying"
	| "failed";

export type DomainDnsRecord = {
	type: "A" | "CNAME" | "TXT";
	name: string;
	value: string;
};

export type DomainAutomationDetail = {
	hostname: string;
	tenantSlug: string;
	tenantName: string;
	provider: DomainProvider;
	providerLabel: string;
	isApex: boolean;
	currentIps: string[];
	currentCnames: string[];
	nameservers: string[];
	targetIp: string;
	targetCname: string;
	pointsToGigBlade: boolean;
	vercelVerified: boolean;
	edgeConfigSynced: boolean;
	sslActive: boolean;
	oneClickUrl: string | null;
	status: DomainProvisionStatus;
	lastCheckedAt: string;
	recommendedRecords: DomainDnsRecord[];
};

export type DomainDnsScanResult = {
	hostname: string;
	provider: DomainProvider;
	providerLabel: string;
	isApex: boolean;
	currentIps: string[];
	currentCnames: string[];
	nameservers: string[];
	targetIp: string;
	targetCname: string;
	pointsToGigBlade: boolean;
	oneClickUrl: string | null;
	recommendedRecords: DomainDnsRecord[];
};

export async function fetchPlatformDomains(): Promise<DomainAutomationDetail[]> {
	const body = (await panelFetch("/api/platform/domains", {
		method: "GET",
		timeoutMs: 15000,
	})) as { domains?: DomainAutomationDetail[] };
	return body?.domains ?? [];
}

export async function checkDomainDns(input: {
	domain: string;
}): Promise<DomainDnsScanResult> {
	const body = (await panelFetch("/api/platform/domains/check", {
		method: "POST",
		body: JSON.stringify({ domain: input.domain }),
		timeoutMs: 15000,
	})) as { scan?: DomainDnsScanResult };
	if (!body?.scan) {
		throw new Error("No se pudo escanear el dominio.");
	}
	return body.scan;
}

export async function assignPlatformDomain(input: {
	slug: string;
	domain: string;
}): Promise<DomainAutomationDetail> {
	const body = (await panelFetch("/api/platform/domains", {
		method: "POST",
		body: JSON.stringify({ slug: input.slug, domain: input.domain }),
		timeoutMs: 15000,
	})) as { domain?: DomainAutomationDetail };
	if (!body?.domain) {
		throw new Error("No se pudo conectar el dominio.");
	}
	return body.domain;
}

export async function verifyPlatformDomain(input: {
	domain: string;
}): Promise<DomainAutomationDetail> {
	const body = (await panelFetch("/api/platform/domains/verify", {
		method: "POST",
		body: JSON.stringify({ domain: input.domain }),
		timeoutMs: 15000,
	})) as { domain?: DomainAutomationDetail };
	if (!body?.domain) {
		throw new Error("No se pudo verificar el dominio.");
	}
	return body.domain;
}

export async function deletePlatformDomain(input: {
	domain: string;
	slug?: string;
}): Promise<{ success: boolean; hostname: string }> {
	const body = (await panelFetch("/api/platform/domains", {
		method: "DELETE",
		body: JSON.stringify({ domain: input.domain, slug: input.slug }),
		timeoutMs: 15000,
	})) as { success?: boolean; hostname?: string };
	return {
		success: Boolean(body?.success),
		hostname: body?.hostname ?? input.domain,
	};
}

export type PlatformAffiliate = {
	id: string;
	code: string;
	name: string;
	email: string;
	phone: string | null;
	paymentMethod: "sinpe" | "iban";
	paymentDetails: {
		sinpePhone?: string;
		iban?: string;
		bankName?: string;
		accountHolder?: string;
	};
	customPercentageEnabled: boolean;
	customPercentages: Record<string, number> | null;
	status: "active" | "paused" | "archived";
	referralLink: string;
	totalConversions: number;
	totalEarned: number;
	totalPaid: number;
	pendingBalance: number;
	createdAt: string;
	updatedAt: string;
};

export type PlatformReferralConversion = {
	id: string;
	affiliateId: string;
	affiliateCode: string;
	affiliateName: string;
	djName: string;
	djEmail: string;
	djWaitlistId: string | null;
	tenantId: string | null;
	chargeType?: "initial_setup" | "monthly" | string;
	amountUsd?: number;
	amountCrc?: number;
	commissionPercentage: number;
	commissionAmountUsd?: number;
	commissionAmountCrc?: number;
	packageId?: string;
	packagePrice?: number;
	commissionAmount: number;
	currency: string;
	status: "pending" | "approved" | "rejected";
	payoutId: string | null;
	payoutStatus: "unpaid" | "paid";
	createdAt: string;
	updatedAt: string;
};

export type PlatformReferralSettings = {
	id?: string;
	currency: string;
	exchangeRateCrc: number;
	initialSetupPriceUsd: number;
	initialSetupPercent: number;
	monthlyPriceUsd: number;
	monthlyPercent: number;
	developerPercent?: number;
	founderPercent?: number;
	maintenanceMonthlyCostUsd?: number;
	maintenancePercent?: number;
	model?: "percentage" | "fixed";
	percentages: Record<string, number>;
	packagePrices: Record<string, number>;
	isActive: boolean;
	updatedAt: string;
};

export type PlatformReferralPayout = {
	id: string;
	affiliateId: string;
	affiliateCode: string;
	affiliateName: string;
	amount: number;
	amountUsd?: number;
	currency: string;
	method: "sinpe" | "iban";
	referenceNumber: string;
	note: string | null;
	paidAt: string;
};

export type PlatformReferralsData = {
	affiliates: PlatformAffiliate[];
	conversions: PlatformReferralConversion[];
	settings: PlatformReferralSettings;
	payouts: PlatformReferralPayout[];
};

export async function fetchPlatformReferrals(
	signal?: AbortSignal,
): Promise<PlatformReferralsData> {
	const body = (await panelFetch("/api/platform/referrals", {
		method: "GET",
		signal,
		timeoutMs: 15000,
	})) as PlatformReferralsData;
	return {
		affiliates: body?.affiliates ?? [],
		conversions: body?.conversions ?? [],
		settings: body?.settings ?? {
			currency: "USD",
			exchangeRateCrc: 515,
			initialSetupPriceUsd: 100,
			initialSetupPercent: 20,
			monthlyPriceUsd: 30,
			monthlyPercent: 15,
			developerPercent: 50,
			founderPercent: 50,
			maintenanceMonthlyCostUsd: 0,
			maintenancePercent: 0,
			model: "percentage",
			percentages: { initial_setup: 20, monthly: 15 },
			packagePrices: { initial_setup: 100, monthly: 30 },
			isActive: true,
			updatedAt: new Date().toISOString(),
		},
		payouts: body?.payouts ?? [],
	};
}

export async function createPlatformAffiliate(input: {
	code: string;
	name: string;
	email: string;
	phone?: string;
	paymentMethod: "sinpe" | "iban";
	sinpePhone?: string;
	iban?: string;
	bankName?: string;
	customPercentageEnabled?: boolean;
	customPercentages?: Record<string, number>;
}): Promise<PlatformAffiliate> {
	const body = (await panelFetch("/api/platform/referrals", {
		method: "POST",
		body: JSON.stringify(input),
		timeoutMs: 15000,
	})) as { affiliate?: PlatformAffiliate };
	if (!body?.affiliate) {
		throw new Error("No se pudo crear el afiliado.");
	}
	return body.affiliate;
}

export async function updatePlatformReferralSettings(input: {
	currency?: string;
	exchangeRateCrc?: number;
	initialSetupPriceUsd?: number;
	initialSetupPercent?: number;
	monthlyPriceUsd?: number;
	monthlyPercent?: number;
	developerPercent?: number;
	founderPercent?: number;
	maintenanceMonthlyCostUsd?: number;
	maintenancePercent?: number;
	percentages?: Record<string, number>;
	packagePrices?: Record<string, number>;
}): Promise<PlatformReferralSettings> {
	const body = (await panelFetch("/api/platform/referrals/settings", {
		method: "PUT",
		body: JSON.stringify(input),
		timeoutMs: 15000,
	})) as { settings?: PlatformReferralSettings };
	if (!body?.settings) {
		throw new Error("No se pudieron guardar los ajustes de comisión.");
	}
	return body.settings;
}

export async function recordPlatformReferralPayout(input: {
	affiliateId: string;
	amount: number;
	currency?: string;
	method: "sinpe" | "iban";
	referenceNumber: string;
	note?: string;
}): Promise<PlatformReferralPayout> {
	const body = (await panelFetch("/api/platform/referrals/payouts", {
		method: "POST",
		body: JSON.stringify(input),
		timeoutMs: 15000,
	})) as { payout?: PlatformReferralPayout };
	if (!body?.payout) {
		throw new Error("No se pudo registrar la liquidación.");
	}
	return body.payout;
}

export async function fetchMeetingAvailability(): Promise<
	import("@/domain/meeting-availability").MeetingAvailability
> {
	const body = (await panelFetch("/api/platform/waitlist/availability", {
		timeoutMs: 10000,
	})) as {
		availability?: import("@/domain/meeting-availability").MeetingAvailability;
	};
	if (!body?.availability) {
		throw new Error("No se pudo cargar la disponibilidad.");
	}
	return body.availability;
}

export async function updateMeetingAvailability(
	availability: import("@/domain/meeting-availability").MeetingAvailability,
): Promise<import("@/domain/meeting-availability").MeetingAvailability> {
	const body = (await panelFetch("/api/platform/waitlist/availability", {
		method: "PUT",
		body: JSON.stringify(availability),
		timeoutMs: 10000,
	})) as {
		availability?: import("@/domain/meeting-availability").MeetingAvailability;
	};
	if (!body?.availability) {
		throw new Error("No se pudo guardar la disponibilidad.");
	}
	return body.availability;
}




