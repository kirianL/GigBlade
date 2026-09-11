"use client";

import dynamic from "next/dynamic";
import { useMediaQuery } from "@/lib/use-media-query";
import PricingModelsMobile from "./pricing-models-mobile";

const PricingModelsDesktop = dynamic(() => import("./pricing-models-desktop"), {
	ssr: false,
});

export default function PricingModels() {
	const isLg = useMediaQuery("(min-width: 1024px)");

	return (
		<div id="temas">
			<div className="lg:hidden">
				<PricingModelsMobile />
			</div>
			<div className="hidden min-h-[420px] lg:block">
				{isLg && <PricingModelsDesktop />}
			</div>
		</div>
	);
}
