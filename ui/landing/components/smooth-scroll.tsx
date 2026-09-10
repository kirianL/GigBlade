"use client";

import { useEffect } from "react";
import { startSmoothScroll } from "@/lib/smooth-scroll";
import "lenis/dist/lenis.css";

export default function SmoothScroll() {
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

	return null;
}
