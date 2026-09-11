"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import type { LayoutProps } from "@/lib/types";
import { useMediaQuery } from "@/lib/use-media-query";

const ElasticRecoilPhysics = dynamic(() => import("./elastic-recoil-physics"), {
	ssr: false,
});

export default function ElasticRecoil({ children }: LayoutProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const wrapRef = useRef<HTMLDivElement>(null);

	return (
		<div className="relative w-full overflow-x-hidden">
			{isDesktop && <ElasticRecoilPhysics targetRef={wrapRef} />}
			<div
				ref={wrapRef}
				className="relative z-10 bg-black md:will-change-transform"
			>
				{children}
			</div>
		</div>
	);
}
