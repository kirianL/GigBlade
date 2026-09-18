import type { Metadata } from "next";
import JsonLd from "@/components/json-ld";
import PricingSections from "@/components/pricing-sections";
import { faqPageSchema, organizationSchema, websiteSchema } from "@/lib/seo";

export const metadata: Metadata = {
	title: "Precios",
	description:
		"US$ 65 al mes cubre hosting, seguridad y tu página. El dominio se cobra aparte, al costo real, sin margen.",
	alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
	return (
		<>
			<JsonLd data={[organizationSchema(), websiteSchema(), faqPageSchema()]} />
			<PricingSections />
			<div className="mt-10.5 hidden w-full flex-col gap-2.5 md:flex">
				<div className="w-full border-t border-[#292929]" />
				<div className="w-full border-t border-[#292929]" />
				<div className="w-full border-t border-[#292929]" />
				<div className="w-full border-t border-[#292929]" />
				<div className="w-full border-t border-[#292929]" />
			</div>
		</>
	);
}
