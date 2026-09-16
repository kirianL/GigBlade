import { cn } from "@/lib/utils";

export function GigBladeMark({ className }: { className?: string }) {
	return (
		<span
			className={cn(
				"font-sans text-[20px] font-medium tracking-[-0.03em] text-foreground",
				className,
			)}
		>
			GigBlade
		</span>
	);
}
