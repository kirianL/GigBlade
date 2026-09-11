"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { scrollToHashWhenReady } from "@/lib/smooth-scroll";
import CustomerStories from "./customer-stories";
import Hero from "./hero";
import LazySection from "./lazy-section";
import Problem from "./problem";
import SectionDivider from "./section-divider";
import Solution from "./solution";

function SectionReserve({ height }: { height: number }) {
	return (
		<div
			className="bg-black"
			style={{ minHeight: height }}
			aria-hidden="true"
		/>
	);
}

// Near-fold sections ship with the hero so mobile HTML is complete on first
// paint. Heavier below-fold JS (GSAP, motion, videos) stays code-split.
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

export default function HomeSections() {
	useEffect(() => {
		if (!window.location.hash) return;
		scrollToHashWhenReady(window.location.hash);
	}, []);

	return (
		<>
			<Hero />

			<LazySection>
				<SectionDivider title="EJEMPLOS" />
				<CustomerStories />
			</LazySection>
			<LazySection>
				<SectionDivider title="EL PROBLEMA" />
				<Problem />
			</LazySection>
			<LazySection>
				<SectionDivider title="CÓMO FUNCIONA" />
				<Solution />
			</LazySection>
			<LazySection>
				<SectionDivider title="TEMAS Y PLAN" />
				<PricingModels />
			</LazySection>
			<LazySection>
				<SectionDivider title="QUÉ INCLUYE" />
				<Features />
			</LazySection>
			<LazySection>
				<SectionDivider title="TODO INCLUIDO" />
				<ProductionScale />
			</LazySection>
			<LazySection>
				<SectionDivider title="FAQ" />
				<FAQ />
			</LazySection>
			<LazySection>
				<Footer />
			</LazySection>
		</>
	);
}
