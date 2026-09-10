import { featuredCustomerStories } from "@/app/constant";
import { BracketCorners } from "./bracket-corners";
import { StoryPanel } from "./story-panel";

export function MobileCarousel() {
	return (
		<div className="lg:hidden mt-8 mb-12">
			<div className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
				{featuredCustomerStories.map((story) => (
					<article
						key={story.slug}
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
		</div>
	);
}
