"use client";

import CustomerStories from "./customer-stories";
import Hero from "./hero";
import SectionDivider from "./section-divider";

export default function HomeAboveFold() {
	return (
		<>
			<Hero />
			<SectionDivider title="EJEMPLOS" />
			<CustomerStories />
		</>
	);
}
