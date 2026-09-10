import Navbar from "@/components/navbar";
import type { LayoutProps, PageStyle } from "@/lib/types";

export default function SiteFrame({ children }: LayoutProps) {
	return (
		<div
			className="w-full overflow-x-hidden"
			style={
				{
					"--page-pad": "max(2.5rem, calc((100vw - 1440px) / 2))",
				} as PageStyle
			}
		>
			<div className="relative z-10 min-h-dvh bg-black">
				<a
					href="#contenido"
					className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-brand focus:px-3 focus:py-2 focus:text-white"
				>
					Saltar al contenido
				</a>
				<div className="relative w-full px-4 pt-5 md:px-(--page-pad)">
					<div className="pointer-events-none absolute top-0 bottom-0 left-4 z-50 border-l border-[#292929] md:left-(--page-pad)" />
					<div className="pointer-events-none absolute top-0 right-4 bottom-0 z-50 border-r border-[#292929] md:right-(--page-pad)" />
					<Navbar />
					<div id="contenido">{children}</div>
				</div>
			</div>
		</div>
	);
}
