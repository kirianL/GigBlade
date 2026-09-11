"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type ReactNode, useRef } from "react";

if (typeof window !== "undefined") {
	gsap.registerPlugin(ScrollTrigger);
}

export default function ProductionScaleMotion({
	children,
}: {
	children: ReactNode;
}) {
	const containerRef = useRef<HTMLDivElement | null>(null);

	useGSAP(
		() => {
			if (window.matchMedia("(max-width: 1023px)").matches) {
				return;
			}

			gsap.set(".ps-card", {
				opacity: 0,
				y: 30,
				scale: 0.985,
				force3D: true,
			});

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: ".ps-section",
					start: "top 75%",
					once: true,
				},
				defaults: { overwrite: "auto", force3D: true },
			});

			const cardEls = gsap.utils.toArray<HTMLElement>(".ps-card");
			cardEls.forEach((card, i) => {
				tl.to(
					card,
					{
						opacity: 1,
						y: 0,
						scale: 1,
						duration: 0.78,
						ease: "expo.out",
					},
					0.22 + i * 0.1,
				);
			});
		},
		{ scope: containerRef },
	);

	return (
		<div ref={containerRef} className="overflow-hidden">
			{children}
		</div>
	);
}
