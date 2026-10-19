import JsonLd from "@/components/json-ld";
import PricingSections from "@/components/pricing-sections";
import { faqPageSchema, organizationSchema, pageSeo, websiteSchema } from "@/lib/seo";

export const metadata = pageSeo({
	title: "Precios",
	description:
		"US$ 120 para dejar tu página lista y US$ 30 al mes cubren hosting, seguridad y tu página. El dominio lo comprás vos, aparte.",
	path: "/pricing",
});

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
