"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { scrollToHashWhenReady } from "@/lib/smooth-scroll";
import LazySection from "./lazy-section";
import SectionDivider from "./section-divider";

function SectionReserve({ height }: { height: number }) {
	return (
		<div
			className="bg-black"
			style={{ minHeight: height }}
			aria-hidden="true"
		/>
	);
}

const PricingModels = dynamic(() => import("./pricing-models"), {
	loading: () => <SectionReserve height={520} />,
});
const Features = dynamic(() => import("./features"), {
	loading: () => <SectionReserve height={720} />,
});
const ProductionScale = dynamic(() => import("./production-scale"), {
	loading: () => <SectionReserve height={480} />,
});
const FAQ = dynamic(() => import("./faq"), {
	loading: () => <SectionReserve height={420} />,
});
const Footer = dynamic(() => import("./footer"), {
	loading: () => <SectionReserve height={600} />,
});

export default function HomeBelowFold() {
	useEffect(() => {
		if (!window.location.hash) return;
		scrollToHashWhenReady(window.location.hash);
	}, []);

	return (
		<>
			<LazySection reserve={560} hash="temas">
				<SectionDivider title="TEMAS Y PLAN" />
				<PricingModels />
			</LazySection>
			<LazySection reserve={760}>
				<SectionDivider title="QUÉ INCLUYE" />
				<Features />
			</LazySection>
			<LazySection reserve={520}>
				<SectionDivider title="TODO INCLUIDO" />
				<ProductionScale />
			</LazySection>
			<LazySection reserve={460} hash="faq">
				<SectionDivider title="FAQ" />
				<FAQ />
			</LazySection>
			<LazySection reserve={640}>
				<Footer />
			</LazySection>
		</>
	);
}
