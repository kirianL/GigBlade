"use client";

import dynamic from "next/dynamic";
import { useMediaQuery } from "@/lib/use-media-query";
import FAQMobile from "./faq-mobile";

const FAQDesktop = dynamic(() => import("./faq-desktop"), { ssr: false });

export default function FAQ() {
	const isLg = useMediaQuery("(min-width: 1024px)");

	return (
		<div id="faq">
			<div className="lg:hidden">
				<FAQMobile />
			</div>
			<div className="hidden min-h-[500px] lg:block">
				{isLg && <FAQDesktop />}
			</div>
		</div>
	);
}
