import type { Metadata } from "next";
import Footer from "@/components/footer";
import { TERMS_EFFECTIVE_DATE, termsSections } from "@/lib/termsContent";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Terms of Service",
	description:
		"Autumn's Terms of Service covering use of our billing infrastructure, APIs, and SDKs.",
	alternates: { canonical: "/terms" },
};

export default function TermsOfService() {
	return (
		<>
			<div className="flex w-full flex-col border-b border-[#292929]">
				<div className="flex w-full border-b border-[#292929]">
					<div className="hidden w-1/8 border-r border-[#292929] bg-[#0F0F0F] md:block lg:w-1/6" />
					<div className="flex-1 bg-[#0F0F0F] px-4 py-10 sm:px-8 md:py-16">
						<h1 className="font-sans text-[40px] tracking-[-2%] text-white uppercase">
							Terms of Service
						</h1>
					</div>
					<div className="hidden w-1/8 border-l border-[#292929] bg-[#0F0F0F] md:block lg:w-1/6" />
				</div>

				<div className="flex w-full">
					<div className="hidden w-1/8 border-r border-[#292929] md:block lg:w-1/6" />
					<div className="flex-1 px-4 py-12 pb-32 font-sans text-[16px] leading-[1.6] font-light tracking-[-2%] text-white sm:px-8 md:py-16">
						<p className="mb-10">
							Autumn (Rebase, Inc.)
							<br />
							Effective Date: {TERMS_EFFECTIVE_DATE}
						</p>

						{termsSections.map((term) => (
							<div key={term.title}>
								<h3 className="mt-8 mb-2 text-[24px] leading-[30px] font-normal tracking-[-2%] text-white">
									{term.title}
								</h3>
								<p
									className={cn(
										"mb-6 text-[16px] leading-[20px] font-light tracking-[-2%] md:leading-[24px]",
										term.isUppercase && "uppercase",
									)}
								>
									{term.content}
								</p>
							</div>
						))}
					</div>
					<div className="hidden w-1/8 border-l border-[#292929] md:block lg:w-1/6" />
				</div>
			</div>
			<Footer />
		</>
	);
}
