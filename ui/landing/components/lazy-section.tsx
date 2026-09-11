"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type LazySectionProps = {
	children: ReactNode;
	eager?: boolean;
	reserve?: number;
	order?: number;
	hash?: string;
};

export default function LazySection({
	children,
	eager = false,
	reserve = 420,
	hash,
}: LazySectionProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [mounted, setMounted] = useState(eager);

	useEffect(() => {
		if (mounted) return;

		if (hash) {
			const current = window.location.hash.replace(/^#/, "");
			if (current && current === hash.replace(/^#/, "")) {
				setMounted(true);
				return;
			}
		}

		const el = ref.current;
		if (!el) return;

		if (!("IntersectionObserver" in window)) {
			setMounted(true);
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setMounted(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "400px 0px", threshold: 0 },
		);
		observer.observe(el);

		return () => observer.disconnect();
	}, [hash, mounted]);

	return (
		<div
			ref={ref}
			className="home-section"
			style={mounted ? undefined : { minHeight: reserve }}
		>
			{mounted ? children : null}
		</div>
	);
}
