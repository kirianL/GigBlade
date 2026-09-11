"use client";

import type { ReactNode } from "react";

type LazySectionProps = {
	children: ReactNode;
	/** Kept so existing call sites type-check; sections now render in the HTML. */
	eager?: boolean;
	reserve?: number;
	order?: number;
};

/**
 * Below-the-fold wrapper. Content stays in the SSR HTML so mobile never sees
 * an empty black hole while a chunk or timeout catches up. JS for each
 * section is still code-split via `next/dynamic` in home-sections.
 */
export default function LazySection({ children }: LazySectionProps) {
	return <div className="home-section">{children}</div>;
}
