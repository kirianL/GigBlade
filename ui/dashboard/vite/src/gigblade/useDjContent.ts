import { useEffect, useState } from "react";
import {
	DJ_TEMPLATES,
	TEMPLATE_BRAND_COLORS,
	djBySlug,
	type GigbladeDj,
	type SiteTemplateId,
} from "@/gigblade/concept";
import {
	fetchPublicSite,
	savePublicSite,
	type PublicSite,
} from "@/gigblade/site-api";
import { useSelectedDj } from "@/gigblade/ui";

export type DjPhoto = {
	id: string;
	url: string;
};

export type DjLinkDraft = {
	instagram: string;
	tiktok: string;
	youtube: string;
	facebook: string;
	x: string;
	soundcloud: string;
	spotify: string;
};

export type DjMixDraft = {
	id: string;
	title: string;
	url: string;
};

export type DjEventDraft = {
	id: string;
	date: string;
	venue: string;
	location: string;
	ticketUrl: string;
	photo: string;
	clearPhoto?: boolean;
};

export type DjSectionId = "agenda" | "bio" | "enlaces" | "sets" | "contacto";

export type DjContentDraft = {
	displayName: string;
	tagline: string;
	bio: string;
	city: string;
	template: SiteTemplateId;
	brandColor: string;
	email: string;
	phone: string;
	links: DjLinkDraft;
	mixes: DjMixDraft[];
	events: DjEventDraft[];
	photos: DjPhoto[];
	heroPosition: "center" | "top" | "bottom" | "left" | "right";
	heroStyle: "cinematic" | "poster" | "band" | "type" | "duo";
	heroAlign: "start" | "center";
	surfaceStyle: "plain" | "gradient" | "bands" | "frame";
	agendaStyle: "list" | "cards";
	bioStyle: "quote" | "columns";
	mixStyle: "grid" | "row" | "list";
	linkStyle: "cards" | "icons";
	buttonStyle: "pill" | "square" | "text";
	cornerStyle: "round" | "sharp";
	titleStyle: "tight" | "wide" | "spaced";
	backgroundPattern: "none" | "dots" | "grid" | "diagonal" | "grain";
	hiddenSections: DjSectionId[];
};

const MAX_MIXES = 8;

function mixesFromSite(
	mixes: PublicSite["profile"]["mixes"] | undefined,
): DjMixDraft[] {
	if (!Array.isArray(mixes)) return [];
	return mixes.map((mix) => ({
		id: crypto.randomUUID(),
		title: mix.title,
		url: mix.url,
	}));
}

const EMPTY_LINKS: DjLinkDraft = {
	instagram: "",
	tiktok: "",
	youtube: "",
	facebook: "",
	x: "",
	soundcloud: "",
	spotify: "",
};

function storageKey(slug: string) {
	return `gigblade.dj-content.${slug}`;
}

function cacheDraft(slug: string, draft: DjContentDraft) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(storageKey(slug), JSON.stringify(draft));
}

function isTemplateId(value: string): value is SiteTemplateId {
	return DJ_TEMPLATES.some((template) => template.id === value);
}

const HERO_STYLES = ["cinematic", "poster", "band", "type", "duo"] as const;
const HERO_ALIGNS = ["start", "center"] as const;
const SURFACE_STYLES = ["plain", "gradient", "bands", "frame"] as const;
const AGENDA_STYLES = ["list", "cards"] as const;
const BIO_STYLES = ["quote", "columns"] as const;
const MIX_STYLES = ["grid", "row", "list"] as const;
const LINK_STYLES = ["cards", "icons"] as const;
const BUTTON_STYLES = ["pill", "square", "text"] as const;
const CORNER_STYLES = ["round", "sharp"] as const;
const TITLE_STYLES = ["tight", "wide", "spaced"] as const;
const BACKGROUND_PATTERNS = ["none", "dots", "grid", "diagonal", "grain"] as const;

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
	return allowed.includes(value as T) ? (value as T) : fallback;
}

function isBackgroundPattern(
	value: unknown,
): value is DjContentDraft["backgroundPattern"] {
	return BACKGROUND_PATTERNS.some((pattern) => pattern === value);
}

function defaultsFrom(dj: GigbladeDj): DjContentDraft {
	return {
		displayName: dj.name,
		tagline: "",
		bio: dj.bio,
		city: dj.city,
		template: isTemplateId(dj.template) ? dj.template : DJ_TEMPLATES[0].id,
		brandColor: TEMPLATE_BRAND_COLORS[dj.template] ?? TEMPLATE_BRAND_COLORS.pista,
		email: "",
		phone: "",
		links: {
			...EMPTY_LINKS,
			instagram: dj.instagram,
		},
		mixes: [],
		events: [],
		photos: [],
		heroPosition: "center",
		heroStyle: "cinematic",
		heroAlign: "start",
		surfaceStyle: "plain",
		agendaStyle: "list",
		bioStyle: "quote",
		mixStyle: "grid",
		linkStyle: "cards",
		buttonStyle: "pill",
		cornerStyle: "round",
		titleStyle: "tight",
		backgroundPattern: "none",
		hiddenSections: [],
	};
}

function draftFromSite(site: PublicSite): DjContentDraft {
	return {
		displayName: site.profile.displayName,
		tagline: site.profile.tagline,
		bio: site.profile.bio,
		city: site.profile.city,
		template: site.templateId,
		brandColor:
			site.profile.brandColor ?? TEMPLATE_BRAND_COLORS[site.templateId],
		email: site.profile.email ?? "",
		phone: site.profile.phone ?? "",
		links: {
			...EMPTY_LINKS,
			...site.profile.links,
		},
		mixes: mixesFromSite(site.profile.mixes),
		events: (site.profile.events ?? []).map((event) => ({
			id: crypto.randomUUID(),
			date: event.date,
			venue: event.venue,
			location: event.location,
			ticketUrl: event.ticketUrl ?? "",
			photo: event.photo ?? "",
		})),
		photos: (site.profile.photos ?? []).map((url) => ({
			id: crypto.randomUUID(),
			url,
		})),
		heroPosition: site.profile.heroPosition ?? "center",
		heroStyle: pick(site.profile.heroStyle, HERO_STYLES, "cinematic"),
		heroAlign: pick(site.profile.heroAlign, HERO_ALIGNS, "start"),
		surfaceStyle: pick(site.profile.surfaceStyle, SURFACE_STYLES, "plain"),
		agendaStyle: pick(site.profile.agendaStyle, AGENDA_STYLES, "list"),
		bioStyle: pick(site.profile.bioStyle, BIO_STYLES, "quote"),
		mixStyle: pick(site.profile.mixStyle, MIX_STYLES, "grid"),
		linkStyle: pick(site.profile.linkStyle, LINK_STYLES, "cards"),
		buttonStyle: pick(site.profile.buttonStyle, BUTTON_STYLES, "pill"),
		cornerStyle: pick(site.profile.cornerStyle, CORNER_STYLES, "round"),
		titleStyle: pick(site.profile.titleStyle, TITLE_STYLES, "tight"),
		backgroundPattern: isBackgroundPattern(site.profile.backgroundPattern)
			? site.profile.backgroundPattern
			: "none",
		hiddenSections: site.profile.hiddenSections ?? [],
	};
}

export function readDjContent(slug: string): DjContentDraft {
	const base = defaultsFrom(djBySlug(slug));
	if (typeof window === "undefined") return base;
	try {
		const raw = window.localStorage.getItem(storageKey(slug));
		if (!raw) return base;
		const parsed = JSON.parse(raw) as Partial<DjContentDraft>;
		return {
			...base,
			...parsed,
			template: isTemplateId(parsed.template ?? "")
				? parsed.template
				: base.template,
			brandColor:
				typeof parsed.brandColor === "string" &&
				/^#[0-9A-Fa-f]{6}$/.test(parsed.brandColor)
					? parsed.brandColor.toLowerCase()
					: base.brandColor,
			email:
				typeof parsed.email === "string" ? parsed.email : base.email,
			phone: typeof parsed.phone === "string" ? parsed.phone : base.phone,
			links: { ...EMPTY_LINKS, ...parsed.links },
			mixes: Array.isArray(parsed.mixes) ? parsed.mixes : [],
			events: Array.isArray(parsed.events) ? parsed.events : [],
			photos: Array.isArray(parsed.photos)
				? parsed.photos.filter(
						(photo): photo is DjPhoto =>
							Boolean(photo && typeof photo.url === "string"),
					)
				: [],
			heroPosition:
				parsed.heroPosition === "top" ||
				parsed.heroPosition === "bottom" ||
				parsed.heroPosition === "left" ||
				parsed.heroPosition === "right"
					? parsed.heroPosition
					: "center",
			heroStyle: pick(parsed.heroStyle, HERO_STYLES, "cinematic"),
			heroAlign: pick(parsed.heroAlign, HERO_ALIGNS, "start"),
			surfaceStyle: pick(parsed.surfaceStyle, SURFACE_STYLES, "plain"),
			agendaStyle: pick(parsed.agendaStyle, AGENDA_STYLES, "list"),
			bioStyle: pick(parsed.bioStyle, BIO_STYLES, "quote"),
			mixStyle: pick(parsed.mixStyle, MIX_STYLES, "grid"),
			linkStyle: pick(parsed.linkStyle, LINK_STYLES, "cards"),
			buttonStyle: pick(parsed.buttonStyle, BUTTON_STYLES, "pill"),
			cornerStyle: pick(parsed.cornerStyle, CORNER_STYLES, "round"),
			titleStyle: pick(parsed.titleStyle, TITLE_STYLES, "tight"),
			backgroundPattern: isBackgroundPattern(parsed.backgroundPattern)
				? parsed.backgroundPattern
				: "none",
			hiddenSections: Array.isArray(parsed.hiddenSections)
				? parsed.hiddenSections
				: [],
		};
	} catch {
		return base;
	}
}

function instagramHandle(value: string) {
	const match = value.match(/instagram\.com\/([^/?#]+)/i);
	if (match?.[1]) return `@${match[1]}`;
	if (value.trim()) {
		return value.startsWith("@") ? value.trim() : `@${value.trim()}`;
	}
	return "";
}

export function useDjProfile(options?: { syncLive?: boolean }) {
	const syncLive = options?.syncLive ?? false;
	const { dj, setDj, sitesReady, visitsReady } = useSelectedDj();
	const [draft, setDraft] = useState<DjContentDraft>(() =>
		syncLive ? defaultsFrom(dj) : readDjContent(dj.slug),
	);
	const [live, setLive] = useState(false);

	useEffect(() => {
		if (!visitsReady) return;
		if (!syncLive) {
			setDraft(readDjContent(dj.slug));
			setLive(false);
			return;
		}

		setLive(false);
		setDraft(defaultsFrom(dj));

		const controller = new AbortController();
		void fetchPublicSite(dj.slug, controller.signal).then((site) => {
			if (controller.signal.aborted) return;
			if (!site || site.slug !== dj.slug) {
				setDraft(readDjContent(dj.slug));
				return;
			}
			const next = draftFromSite(site);
			setDraft(next);
			cacheDraft(dj.slug, next);
			setLive(true);
		});

		return () => {
			controller.abort();
		};
	}, [dj.slug, dj.name, dj.city, dj.template, sitesReady, syncLive, visitsReady]);

	const profile: GigbladeDj = {
		...dj,
		name: draft.displayName || dj.name,
		bio: draft.bio,
		city: draft.city,
		template: draft.template,
		instagram: instagramHandle(draft.links.instagram) || dj.instagram,
	};

	const save = async (next: DjContentDraft) => {
		cacheDraft(dj.slug, next);
		setDraft(next);

		const site = await savePublicSite(dj.slug, {
			templateId: next.template,
			displayName: next.displayName,
			tagline: next.tagline,
			city: next.city,
			bio: next.bio,
			email: next.email.trim(),
			phone: next.phone.trim(),
			brandColor: next.brandColor,
			photos: next.photos.map((photo) => photo.url.trim()).filter(Boolean),
			heroPosition: next.heroPosition,
			heroStyle: next.heroStyle,
			heroAlign: next.heroAlign,
			surfaceStyle: next.surfaceStyle,
			agendaStyle: next.agendaStyle,
			bioStyle: next.bioStyle,
			mixStyle: next.mixStyle,
			linkStyle: next.linkStyle,
			buttonStyle: next.buttonStyle,
			cornerStyle: next.cornerStyle,
			titleStyle: next.titleStyle,
			backgroundPattern: next.backgroundPattern,
			events: next.events
				.filter(
					(event) =>
						event.date &&
						event.venue.trim() &&
						event.location.trim(),
				)
				.slice(0, 12)
				.map((event) => {
					const ticketUrl = (event.ticketUrl ?? "").trim();
					const photo = (event.photo ?? "").trim();
					return {
						date: event.date,
						venue: event.venue.trim(),
						location: event.location.trim(),
						...(ticketUrl ? { ticketUrl } : {}),
						...(event.clearPhoto ? { photo: "" } : photo ? { photo } : {}),
					};
				}),
			hiddenSections: next.hiddenSections,
			links: next.links,
			mixes: next.mixes
				.filter((mix) => mix.url.trim())
				.slice(0, MAX_MIXES)
				.map((mix) => ({
					title: mix.title.trim(),
					url: mix.url.trim(),
				})),
		});
		setDraft(draftFromSite(site));
		setLive(true);
		return { live: true };
	};

	return {
		dj: profile,
		setDj,
		draft,
		setDraft,
		save,
		live,
		maxMixes: MAX_MIXES,
		visitsReady,
	};
}
