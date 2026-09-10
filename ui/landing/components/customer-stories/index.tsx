"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
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
	const [desktop, setDesktop] = useState(false);

	useEffect(() => {
		const mq = window.matchMedia("(min-width: 1024px)");
		const update = () => setDesktop(mq.matches);
		update();
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	}, []);

	return (
		<section
			id="ejemplos"
			className="w-full overflow-x-hidden bg-[#0F0F0F] text-white"
		>
			<StoryHeading />
			{desktop ? <DesktopAccordion /> : <MobileCarousel />}
		</section>
	);
}
