"use client";

import { ViewTransition } from "react";
import { useEffect, useState, type PropsWithChildren } from "react";

export default function RouteTransition({ children }: PropsWithChildren) {
	const [desktop, setDesktop] = useState(false);

	useEffect(() => {
		const mq = window.matchMedia(
			"(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
		);
		const update = () => setDesktop(mq.matches);
		update();
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	}, []);

	if (!desktop) return children;
	return <ViewTransition>{children}</ViewTransition>;
}
