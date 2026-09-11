"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
	getLenis,
	scrollPageToTop,
	scrollToHash,
	startSmoothScroll,
} from "@/lib/smooth-scroll";

export default function AppScroll() {
	const pathname = usePathname();
	const first = useRef(true);

	useEffect(() => {
		if (window.matchMedia("(max-width: 1023px)").matches) {
			return;
		}

		let stop: (() => void) | undefined;
		let cancelled = false;
		let idleId = 0;

		const start = () => {
			if (cancelled) return;
			startSmoothScroll().then((cleanup) => {
				if (cancelled) {
					cleanup();
					return;
				}
				stop = cleanup;
			});
		};

		if (typeof window.requestIdleCallback === "function") {
			idleId = window.requestIdleCallback(start, { timeout: 1800 });
		} else {
			idleId = window.setTimeout(start, 1) as unknown as number;
		}

		return () => {
			cancelled = true;
			if (typeof window.cancelIdleCallback === "function") {
				window.cancelIdleCallback(idleId);
			} else {
				window.clearTimeout(idleId);
			}
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
