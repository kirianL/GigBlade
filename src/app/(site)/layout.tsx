import AppScroll from "@/components/app-scroll";
import SiteFrame from "@/components/site-frame";
import type { LayoutProps } from "@/lib/types";

export default function SiteLayout({ children }: LayoutProps) {
	return (
		<>
			<AppScroll />
			<SiteFrame>{children}</SiteFrame>
		</>
	);
}
