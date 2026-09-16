import { useEffect, useState } from "react";
import {
	DJ_TEMPLATES,
	djBySlug,
	type GigbladeDj,
} from "@/gigblade/concept";
import { useSelectedDj } from "@/gigblade/ui";

export type DjPhoto = {
	id: string;
	name: string;
};

export type DjContentDraft = {
	bio: string;
	city: string;
	template: string;
	instagram: string;
	photos: DjPhoto[];
};

function storageKey(slug: string) {
	return `gigblade.dj-content.${slug}`;
}

function defaultsFrom(dj: GigbladeDj): DjContentDraft {
	return {
		bio: dj.bio,
		city: dj.city,
		template: DJ_TEMPLATES.includes(dj.template as (typeof DJ_TEMPLATES)[number])
			? dj.template
			: DJ_TEMPLATES[0],
		instagram: dj.instagram,
		photos: [],
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
			photos: Array.isArray(parsed.photos) ? parsed.photos : [],
		};
	} catch {
		return base;
	}
}

export function useDjProfile() {
	const { dj, setDj } = useSelectedDj();
	const [draft, setDraft] = useState<DjContentDraft>(() =>
		readDjContent(dj.slug),
	);

	useEffect(() => {
		setDraft(readDjContent(dj.slug));
	}, [dj.slug]);

	const profile: GigbladeDj = {
		...dj,
		bio: draft.bio,
		city: draft.city,
		template: draft.template,
		instagram: draft.instagram,
	};

	const save = (next: DjContentDraft) => {
		window.localStorage.setItem(storageKey(dj.slug), JSON.stringify(next));
		setDraft(next);
	};

	return { dj: profile, setDj, draft, setDraft, save };
}
