"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import lottie, { type AnimationItem } from "lottie-web";
import { useEffect, useRef } from "react";

if (typeof window !== "undefined") {
	gsap.registerPlugin(ScrollTrigger);
}

export default function SolutionAnimation() {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const animRef = useRef<AnimationItem | null>(null);

	useEffect(() => {
		const node = containerRef.current;
		const isMobile = window.innerWidth < 768;
		const url = isMobile
			? "/animation/solution-mobile.json"
			: "/animation/solution-desktop.json";
		const abort = new AbortController();
		let cancelled = false;
		let observer: IntersectionObserver | undefined;
		let anim: AnimationItem | null = null;
		let scrollTrigger: ScrollTrigger | null = null;
		let loopTimer: ReturnType<typeof setTimeout> | null = null;

		const initAnimation = () => {
			if (cancelled || !containerRef.current) return;

			fetch(url, { signal: abort.signal })
				.then((res) => {
					if (!res.ok) throw new Error(`Lottie ${res.status}`);
					return res.json();
				})
				.then((animationData) => {
					if (cancelled || !containerRef.current) return;

					anim = lottie.loadAnimation({
						container: containerRef.current,
						renderer: "svg",
						loop: false,
						autoplay: false,
						animationData,
					});
					animRef.current = anim;

					scrollTrigger = ScrollTrigger.create({
						trigger: containerRef.current,
						start: "top 75%",
						onEnter: () => {
							if (!anim) return;
							anim.goToAndPlay(0, true);
							if (loopTimer !== null) window.clearTimeout(loopTimer);
							loopTimer = window.setTimeout(() => {
								if (!anim) return;
								anim.loop = true;
								anim.playSegments(
									[Math.floor(anim.totalFrames * 0.2), anim.totalFrames],
									true,
								);
							}, anim.getDuration() * 1000);
						},
					});
				})
				.catch((error: unknown) => {
					if (abort.signal.aborted) return;
					if (error instanceof DOMException && error.name === "AbortError") {
						return;
					}
				});
		};

		if (node) {
			if (!("IntersectionObserver" in window)) {
				initAnimation();
			} else {
				observer = new IntersectionObserver(
					(entries) => {
						// intersectionRatio > 0 guards against a Safari bug where
						// isIntersecting fires as false on the initial sync callback.
						if (entries[0].isIntersecting || entries[0].intersectionRatio > 0) {
							observer?.disconnect();
							initAnimation();
						}
					},
					{ rootMargin: "200px" },
				);
				observer.observe(node);
			}
		}

		return () => {
			cancelled = true;
			abort.abort();
			observer?.disconnect();
			scrollTrigger?.kill();
			if (loopTimer !== null) window.clearTimeout(loopTimer);
			anim?.destroy();
			animRef.current = null;
		};
	}, []);

	return <div ref={containerRef} style={{ width: "100%" }} />;
}
