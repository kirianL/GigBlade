import AppScroll from "@/components/app-scroll";
import ElasticRecoil from "@/components/elastic-footer";
import SiteFrame from "@/components/site-frame";
import type { LayoutProps } from "@/lib/types";

export default function SiteLayout({ children }: LayoutProps) {
	return (
		<>
			<AppScroll />
			<ElasticRecoil>
				<SiteFrame>{children}</SiteFrame>
			</ElasticRecoil>
		</>
	);
}
