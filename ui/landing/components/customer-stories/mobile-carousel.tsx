"use client";

import { useEffect, useRef, useState } from "react";
import { featuredCustomerStories } from "@/app/constant";
import { BracketCorners } from "./bracket-corners";
import { StoryPanel } from "./story-panel";

export function MobileCarousel() {
	const scrollerRef = useRef<HTMLDivElement>(null);
	const [activeIndex, setActiveIndex] = useState(0);

	useEffect(() => {
		const root = scrollerRef.current;
		if (!root) return;

		const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-story-card]"));
		if (!cards.length) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
				if (!visible) return;
				const index = cards.indexOf(visible.target as HTMLElement);
				if (index >= 0) setActiveIndex(index);
			},
			{ root, threshold: 0.6 },
		);

		for (const card of cards) observer.observe(card);
		return () => observer.disconnect();
	}, []);

	const goTo = (index: number) => {
		const card = scrollerRef.current?.querySelectorAll<HTMLElement>("[data-story-card]")[
			index
		];
		card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
	};

	return (
		<div className="lg:hidden mt-8 mb-12">
			<div
				ref={scrollerRef}
				className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
			>
				{featuredCustomerStories.map((story) => (
					<article
						key={story.slug}
						data-story-card
						className="relative min-h-[440px] w-[min(22rem,calc(100%-1.25rem))] shrink-0 snap-center overflow-hidden p-6"
						style={{ backgroundColor: story.surface }}
					>
						<div className="relative z-10 flex h-full min-h-[392px] flex-col">
							<StoryPanel story={story} />
						</div>
						<BracketCorners />
					</article>
				))}
			</div>

			<div className="flex justify-center gap-2 mt-5">
				{featuredCustomerStories.map((story, index) => (
					<button
						key={story.slug}
						type="button"
						aria-label={`Go to ${story.name}`}
						onClick={() => goTo(index)}
						className="h-1.5 rounded-full transition-all duration-300"
						style={{
							width: index === activeIndex ? 20 : 6,
							backgroundColor: index === activeIndex ? story.accent : "#3A3A3A",
						}}
					/>
				))}
			</div>
		</div>
	);
}
