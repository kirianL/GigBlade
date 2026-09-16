import type { Metadata } from "next";
import Footer from "@/components/footer";
import type { LayoutProps } from "@/lib/types";

export const metadata: Metadata = {
	robots: { index: false, follow: false },
};

export default function AlogLayout({ children }: LayoutProps) {
	return (
		<>
			<div className="mt-2.5 flex flex-col gap-2.5">
				<div className="w-full border-t border-[#292929]" />
				<div className="hidden w-full border-t border-[#292929] md:block" />
				<div className="hidden w-full border-t border-[#292929] md:block" />
				<div className="hidden w-full border-t border-[#292929] md:block" />
			</div>
			{children}
			<Footer />
		</>
	);
}
