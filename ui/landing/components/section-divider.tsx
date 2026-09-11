"use client";

import { useMediaQuery } from "@/lib/use-media-query";
import SlotLabel from "./slot-label";

export default function SectionDivider({ title }: { title: string }) {
	const isLg = useMediaQuery("(min-width: 1024px)");
	const label = `// ${title}`;
	const labelClass =
		"font-mono text-[#FFFFFF99] text-[14px] tracking-[-2%] leading-[14px] uppercase";

	return (
		<>
			<div className="flex flex-col gap-2.5">
				<div className="w-full border-t border-[#292929]" />
				<div className="w-full border-t border-[#292929]" />
				<div className="w-full border-t border-[#292929]" />
				<div className="w-full border-t border-[#292929]" />
			</div>
			<div className="mt-2.5 flex w-[calc(100%+calc(var(--page-pad)*2))] -ml-(--page-pad) border-y border-[#292929] bg-[#000000]">
				<div className="flex flex-1 items-center py-6.5 pl-[calc(var(--page-pad)+16px)] xl:pl-[calc(var(--page-pad)+90px)]">
					{isLg ? (
						<SlotLabel text={label} playOnView className={labelClass} />
					) : (
						<span className={labelClass}>{label}</span>
					)}
				</div>
			</div>
		</>
	);
}
