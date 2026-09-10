import type { Metadata } from "next";
import HomeSections from "@/components/home-sections";
import JsonLd from "@/components/json-ld";
import {
	faqPageSchema,
	organizationSchema,
	softwareApplicationSchema,
	websiteSchema,
} from "@/lib/seo";

export const metadata: Metadata = {
	alternates: { canonical: "/" },
};

export default function Home() {
	return (
		<>
			<JsonLd
				data={[
					organizationSchema(),
					websiteSchema(),
					softwareApplicationSchema(),
					faqPageSchema(),
				]}
			/>
			<div className="flex flex-col gap-2.5">
				<div className="w-full border-t border-[#292929]" />
				<div className="hidden w-full border-t border-[#292929] md:block" />
				<div className="hidden w-full border-t border-[#292929] md:block" />
				<div className="hidden w-full border-t border-[#292929] md:block" />
				<div className="hidden w-full border-t border-[#292929] md:block" />
			</div>
			<HomeSections />
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
