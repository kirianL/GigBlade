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
	name: string;
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

export type DjContentDraft = {
	displayName: string;
	tagline: string;
	bio: string;
	city: string;
	template: SiteTemplateId;
	brandColor: string;
	links: DjLinkDraft;
	photos: DjPhoto[];
};

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

function isTemplateId(value: string): value is SiteTemplateId {
	return DJ_TEMPLATES.some((template) => template.id === value);
}

function defaultsFrom(dj: GigbladeDj): DjContentDraft {
	return {
		displayName: dj.name,
		tagline: "",
		bio: dj.bio,
		city: dj.city,
		template: isTemplateId(dj.template) ? dj.template : DJ_TEMPLATES[0].id,
		brandColor: TEMPLATE_BRAND_COLORS[dj.template] ?? TEMPLATE_BRAND_COLORS.pista,
		links: {
			...EMPTY_LINKS,
			instagram: dj.instagram,
		},
		photos: [],
	};
}

function draftFromSite(site: PublicSite, photos: DjPhoto[]): DjContentDraft {
	return {
		displayName: site.profile.displayName,
		tagline: site.profile.tagline,
		bio: site.profile.bio,
		city: site.profile.city,
		template: site.templateId,
		brandColor:
			site.profile.brandColor ?? TEMPLATE_BRAND_COLORS[site.templateId],
		links: {
			...EMPTY_LINKS,
			...site.profile.links,
		},
		photos,
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
			links: { ...EMPTY_LINKS, ...parsed.links },
			photos: Array.isArray(parsed.photos) ? parsed.photos : [],
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
	const { dj, setDj } = useSelectedDj();
	const [draft, setDraft] = useState<DjContentDraft>(() =>
		readDjContent(dj.slug),
	);
	const [live, setLive] = useState(false);

	useEffect(() => {
		const local = readDjContent(dj.slug);
		setDraft(local);
		setLive(false);
		if (!syncLive) return;

		const controller = new AbortController();
		void fetchPublicSite(dj.slug, controller.signal).then((site) => {
			if (controller.signal.aborted || !site || site.slug !== dj.slug) return;
			setDraft(draftFromSite(site, local.photos));
			setLive(true);
		});

		return () => {
			controller.abort();
		};
	}, [dj.slug, syncLive]);

	const profile: GigbladeDj = {
		...dj,
		name: draft.displayName || dj.name,
		bio: draft.bio,
		city: draft.city,
		template: draft.template,
		instagram: instagramHandle(draft.links.instagram) || dj.instagram,
	};

	const save = async (next: DjContentDraft) => {
		window.localStorage.setItem(storageKey(dj.slug), JSON.stringify(next));
		setDraft(next);

		const site = await savePublicSite(dj.slug, {
			templateId: next.template,
			displayName: next.displayName,
			tagline: next.tagline,
			city: next.city,
			bio: next.bio,
			brandColor: next.brandColor,
			links: next.links,
		});
		setDraft(draftFromSite(site, next.photos));
		setLive(true);
		return { live: true };
	};

	return { dj: profile, setDj, draft, setDraft, save, live };
}
