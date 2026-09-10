"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
	getLenis,
	scrollPageToTop,
	scrollToHash,
	startSmoothScroll,
} from "@/lib/smooth-scroll";
import "lenis/dist/lenis.css";

export default function AppScroll() {
	const pathname = usePathname();
	const first = useRef(true);

	useLayoutEffect(() => {
		document.documentElement.toggleAttribute("data-home-intro", pathname === "/");
	}, [pathname]);

	useEffect(() => {
		let stop: (() => void) | undefined;
		let cancelled = false;

		startSmoothScroll().then((cleanup) => {
			if (cancelled) {
				cleanup();
				return;
			}
			stop = cleanup;
		});

		return () => {
			cancelled = true;
			stop?.();
		};
	}, []);

	useEffect(() => {
		if (first.current) {
			first.current = false;
			if (window.location.hash) {
				requestAnimationFrame(() => scrollToHash(window.location.hash));
			}
			return;
		}

		getLenis()?.resize();

		if (window.location.hash) {
			requestAnimationFrame(() => scrollToHash(window.location.hash));
			return;
		}

		scrollPageToTop();
	}, [pathname]);

	return null;
}
