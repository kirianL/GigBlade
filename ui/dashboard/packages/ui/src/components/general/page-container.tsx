import { cn } from "@autumn/ui/lib/utils";

interface PageContainerProps {
	children: React.ReactNode;
	className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
	return (
		<div
			className={cn(
				"flex flex-col gap-4 relative w-full min-w-0 max-w-5xl mx-auto pb-8 pt-4 sm:pt-8 px-4 sm:px-10",
				className,
			)}
		>
			{children}
		</div>
	);
}
