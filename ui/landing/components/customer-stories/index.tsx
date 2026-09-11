"use client";

import dynamic from "next/dynamic";
import { useMediaQuery } from "@/lib/use-media-query";
import { MobileCarousel } from "./mobile-carousel";
import { StoryHeading } from "./story-heading";

const DesktopAccordion = dynamic(
	() =>
		import("./desktop-accordion").then((mod) => ({
			default: mod.DesktopAccordion,
		})),
	{ ssr: false },
);

export default function CustomerStories() {
	const isLg = useMediaQuery("(min-width: 1024px)");

	return (
		<section
			id="ejemplos"
			className="w-full overflow-x-hidden bg-[#0F0F0F] text-white"
		>
			<StoryHeading />
			<div className="lg:hidden">
				<MobileCarousel />
			</div>
			<div className="hidden min-h-[420px] lg:block">
				{isLg && <DesktopAccordion />}
			</div>
		</section>
	);
}
