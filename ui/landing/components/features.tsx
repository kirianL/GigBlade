"use client";

import dynamic from "next/dynamic";
import { featuresData } from "@/app/constant";
import { useMediaQuery } from "@/lib/use-media-query";

const FeatureCardDesktop = dynamic(() => import("./feature-card-desktop"), {
	ssr: false,
});

function FeatureCardMobile({
	feature,
}: {
	feature: (typeof featuresData)[number];
}) {
	return (
		<div className="relative flex min-h-[200px] flex-col justify-between overflow-hidden border-r border-b border-[#292929] bg-[#0F0F0F] p-6 px-4">
			<div className="relative z-10 flex h-full flex-col gap-[42px]">
				<feature.Icon className="h-6 w-6 text-white" />
				<div className="flex flex-col gap-2">
					<h3 className="font-sans text-[20px] leading-6 font-normal tracking-[-5%] text-white">
						{feature.title}
					</h3>
					<p className="w-full pr-2 font-sans text-[14px] leading-[18px] font-light tracking-[-2%] text-pretty text-[#FFFFFF99]">
						{feature.description}
					</p>
				</div>
			</div>
		</div>
	);
}

export default function Features() {
	const isMd = useMediaQuery("(min-width: 768px)");

	return (
		<section className="w-full bg-[#000000]">
			<div className="flex flex-col items-start px-4 py-12 sm:px-8 md:px-4 md:py-16 xl:px-22.75">
				<h2 className="font-sans text-[30px] leading-[32px] tracking-[-4%] md:text-[40px] md:leading-[44px]">
					<div className="text-[#FFFFFF99]">Todo lo que necesitás</div>
					<div className="text-white">para verte profesional.</div>
				</h2>
				<div className="mt-4 max-w-[420px] font-sans text-[16px] leading-[20px] font-light tracking-[-2%] text-[#FFFFFF99]">
					Página, dominio y booking,{" "}
					<span className="text-white">sin tocar lo técnico.</span>
				</div>
			</div>

			<div className="w-full border-t border-[#292929]" />
			<div className="grid grid-cols-1 gap-[-3px] border-[#292929] md:grid-cols-2 lg:grid-cols-3 xl:px-22.75 [&>*:last-child]:border-b-0 md:[&>*:nth-last-child(-n+2)]:border-b-0 lg:[&>*:nth-last-child(-n+3)]:border-b-0 *:border-l md:[&>*:nth-child(2n)]:border-l-0 lg:[&>*:nth-child(3n+1)]:border-l lg:[&>*:nth-child(3n+2)]:border-l-0 lg:[&>*:nth-child(3n)]:border-l-0">
				{featuresData.map((feature) =>
					isMd ? (
						<FeatureCardDesktop key={feature.title} feature={feature} />
					) : (
						<FeatureCardMobile key={feature.title} feature={feature} />
					),
				)}
			</div>
		</section>
	);
}
