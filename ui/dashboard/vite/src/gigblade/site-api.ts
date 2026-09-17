import { djPreviewOrigin } from "@/gigblade/concept";

const FETCH_TIMEOUT_MS = 4000;

export type PublicSiteProfile = {
	displayName: string;
	tagline: string;
	city: string;
	bio: string;
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
	brandColor?: string;
	links?: PublicSiteProfile["links"];
};

async function readJson(response: Response) {
	return response.json().catch(() => null);
}

function withTimeout(parent?: AbortSignal) {
	const controller = new AbortController();
	const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	parent?.addEventListener("abort", () => controller.abort(), { once: true });
	return {
		signal: controller.signal,
		cancel: () => window.clearTimeout(timer),
	};
}

function tenantApi(slug: string) {
	return `${djPreviewOrigin(slug)}/api/tenant`;
}

export async function fetchPublicSite(
	slug: string,
	signal?: AbortSignal,
): Promise<PublicSite | null> {
	const timeout = withTimeout(signal);
	try {
		const response = await fetch(tenantApi(slug), {
			signal: timeout.signal,
		});
		if (!response.ok) return null;
		return (await readJson(response)) as PublicSite;
	} catch {
		return null;
	} finally {
		timeout.cancel();
	}
}

export async function savePublicSite(
	slug: string,
	input: SiteContentPatch,
	signal?: AbortSignal,
): Promise<PublicSite> {
	const timeout = withTimeout(signal);
	try {
		const response = await fetch(tenantApi(slug), {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(input),
			signal: timeout.signal,
		});
		const body = await readJson(response);
		if (!response.ok) {
			throw new Error(body?.message || "No se pudo publicar el contenido.");
		}
		return body as PublicSite;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(
				"La página local no respondió. ¿Está corriendo Next en :3000?",
			);
		}
		if (error instanceof Error && error.name !== "TypeError") {
			throw error;
		}
		throw new Error(
			"No se pudo publicar en el preview local. ¿Está corriendo Next en :3000?",
		);
	} finally {
		timeout.cancel();
	}
}
