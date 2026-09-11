"use client";

import type { ReactNode } from "react";

type LazySectionProps = {
	children: ReactNode;
	eager?: boolean;
	reserve?: number;
	order?: number;
	hash?: string;
};

export default function LazySection({ children }: LazySectionProps) {
	return <div className="home-section">{children}</div>;
}
