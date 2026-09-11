import { getGsap } from "./lazyGsap";

type Lenis = import("lenis").default;

let instance: Lenis | null = null;

export function getLenis() {
	return instance;
}

export function scrollPageToTop() {
	if (instance) {
		instance.resize();
		instance.scrollTo(0, {
			duration: 0.42,
			easing: (t) => 1 - (1 - t) ** 3,
		});
		return;
	}

	window.scrollTo({ top: 0, behavior: "smooth" });
}

export function scrollToHashWhenReady(hash: string, timeoutMs = 4000) {
	const id = hash.startsWith("#") ? hash : `#${hash}`;
	if (document.querySelector(id)) {
		scrollToHash(id);
		return;
	}

	const started = Date.now();
	const tick = () => {
		if (document.querySelector(id)) {
			scrollToHash(id);
			return;
		}
		if (Date.now() - started > timeoutMs) return;
		window.requestAnimationFrame(tick);
	};
	window.requestAnimationFrame(tick);
}

export function scrollToHash(hash: string, offset = -80) {
	const id = hash.startsWith("#") ? hash : `#${hash}`;
	const el = document.querySelector<HTMLElement>(id);
	if (!el) return;

	if (instance) {
		instance.scrollTo(el, {
			offset,
			duration: 1.05,
			easing: (t) => 1 - (1 - t) ** 3,
		});
		return;
	}

	const top = el.getBoundingClientRect().top + window.scrollY + offset;
	window.scrollTo({ top, behavior: "smooth" });
}

export async function startSmoothScroll() {
	if (instance) return () => undefined;
	if (window.matchMedia("(max-width: 1023px)").matches) {
		return () => undefined;
	}

	void import("lenis/dist/lenis.css");

	const [{ default: Lenis }, gsap, { ScrollTrigger }] = await Promise.all([
		import("lenis"),
		getGsap(),
		import("gsap/ScrollTrigger"),
	]);

	gsap.registerPlugin(ScrollTrigger);

	const lenis = new Lenis({
		autoRaf: false,
		lerp: 0.068,
		wheelMultiplier: 0.88,
		touchMultiplier: 1,
		syncTouch: false,
		smoothWheel: true,
		respectReducedMotion: true,
		easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
	});

	instance = lenis;

	const onScroll = () => {
		ScrollTrigger.update();
	};
	lenis.on("scroll", onScroll);

	const ticker = (time: number) => {
		lenis.raf(time * 1000);
	};
	gsap.ticker.add(ticker);
	gsap.ticker.lagSmoothing(0);
	document.documentElement.classList.add("lenis");

	return () => {
		gsap.ticker.remove(ticker);
		lenis.off("scroll", onScroll);
		lenis.destroy();
		instance = null;
		document.documentElement.classList.remove("lenis");
	};
}
