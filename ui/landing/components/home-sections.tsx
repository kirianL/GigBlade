"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { scrollToHash } from "@/lib/smooth-scroll";
import Hero from "./hero";
import LazySection from "./lazy-section";
import SectionDivider from "./section-divider";

// All below-fold sections are code-split into separate lazy chunks so the
// initial JS bundle only contains the hero. Framer-motion, GSAP ScrollTrigger,
// and lottie-web are pulled into these chunks rather than the main bundle.
// LazySection gates each component behind an IntersectionObserver so chunks
// and their heavy assets (Lottie JSON, ScrollTrigger) only download as the
// user scrolls toward them rather than all at once on page load.
const CustomerStories = dynamic(() => import("./customer-stories"));
const Problem = dynamic(() => import("./problem"));
const Solution = dynamic(() => import("./solution"));
const PricingModels = dynamic(() => import("./pricing-models"));
const Features = dynamic(() => import("./features"));
const ProductionScale = dynamic(() => import("./production-scale"));
const FAQ = dynamic(() => import("./faq"));
const Footer = dynamic(() => import("./footer"));

function scrollToLocationHash() {
	const hash = window.location.hash;
	if (!hash) return;
	scrollToHash(hash);
}

export default function HomeSections() {
	useEffect(() => {
		if (!window.location.hash) return;
		const timers = [
			setTimeout(scrollToLocationHash, 100),
			setTimeout(scrollToLocationHash, 500),
			setTimeout(scrollToLocationHash, 1200),
		];
		return () => timers.forEach(clearTimeout);
	}, []);

	return (
		<>
			<Hero />

			<LazySection eager>
				<SectionDivider title="EJEMPLOS" />
				<CustomerStories />
			</LazySection>
			<LazySection order={1}>
				<SectionDivider title="EL PROBLEMA" />
				<Problem />
			</LazySection>
			<LazySection order={2}>
				<SectionDivider title="CÓMO FUNCIONA" />
				<Solution />
			</LazySection>
			<LazySection order={3}>
				<SectionDivider title="TEMAS Y PLAN" />
				<PricingModels />
			</LazySection>
			<LazySection order={4}>
				<SectionDivider title="QUÉ INCLUYE" />
				<Features />
			</LazySection>
			<LazySection order={5}>
				<SectionDivider title="TODO INCLUIDO" />
				<ProductionScale />
			</LazySection>
			<LazySection order={6}>
				<SectionDivider title="FAQ" />
				<FAQ />
			</LazySection>
			<LazySection order={7} reserve={600}>
				<Footer />
			</LazySection>
		</>
	);
}
