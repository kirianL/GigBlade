"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

type LazySectionProps = {
	children: ReactNode;
	/** Render immediately — for the first section under the hero. */
	eager?: boolean;
	/** Placeholder height so the page doesn't collapse before mounting. */
	reserve?: number;
	/** Staggers the idle warm-up so sections don't all mount in one frame. */
	order?: number;
};

export default function LazySection({
	children,
	eager = false,
	reserve = 420,
	order = 0,
}: LazySectionProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [mounted, setMounted] = useState(eager);

	useEffect(() => {
		if (mounted) return;
		const el = ref.current;
		if (!el) return;

		// iOS < 12.2 has no IntersectionObserver — mount everything immediately.
		if (!("IntersectionObserver" in window)) {
			setMounted(true);
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				// intersectionRatio > 0 guards against a Safari bug where
				// isIntersecting fires as false on the initial sync callback.
				if (entry.isIntersecting || entry.intersectionRatio > 0) {
					setMounted(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "1200px 0px" },
		);
		observer.observe(el);

		// Warm up the rest of the page once the hero is idle, so nothing pops
		// in while the user is already scrolling past it.
		const isMobile = window.matchMedia("(max-width: 1023px)").matches;
		const warmUp = window.setTimeout(
			() => setMounted(true),
			isMobile ? 3500 + order * 700 : 600 + order * 220,
		);

		return () => {
			observer.disconnect();
			window.clearTimeout(warmUp);
		};
	}, [mounted, order]);

	return (
		<div ref={ref} style={mounted ? undefined : { minHeight: reserve }}>
			{mounted ? children : null}
		</div>
	);
}
