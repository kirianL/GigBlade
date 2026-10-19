import { cn } from "@/lib/utils";

function BootLoader({ compact }: { compact?: boolean }) {
	return (
		<div
			className={cn(
				"rounded-full border-muted-foreground/20 border-t-muted-foreground motion-safe:animate-spin",
				compact
					? "size-5 border-[1.5px]"
					: "size-7 border-2",
			)}
			aria-hidden
		/>
	);
}

export function BootScreen({
	label = "Cargando",
	fullPage = true,
	compact = false,
}: {
	label?: string;
	fullPage?: boolean;
	compact?: boolean;
}) {
	return (
		<div
			className={
				fullPage
					? "flex min-h-dvh w-full items-center justify-center bg-outer-background"
					: "flex min-h-[12rem] w-full flex-1 items-center justify-center py-16"
			}
		>
			<div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
				<BootLoader compact={compact || !fullPage} />
				<span className="sr-only">{label}</span>
			</div>
		</div>
	);
}
