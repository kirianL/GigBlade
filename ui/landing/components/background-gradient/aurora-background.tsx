import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface AuroraBackgroundProps extends HTMLAttributes<HTMLDivElement> {
	children?: ReactNode;
}

const AuroraBackground = forwardRef<HTMLDivElement, AuroraBackgroundProps>(
	({ children, className, ...props }, ref) => {
		return (
			<div
				ref={ref}
				data-slot="aurora-background"
				className={cn(
					"relative isolate overflow-hidden bg-[#0F0F0F]",
					className,
				)}
				{...props}
			>
				<div
					aria-hidden="true"
					className="aurora-blobs pointer-events-none absolute -inset-6 -z-10 blur-xl mix-blend-screen will-change-transform"
				>
					<div className="absolute top-[-20%] left-[-10%] h-[70%] w-[70%] rounded-full bg-brand-soft opacity-55 blur-3xl" />
					<div className="absolute top-[10%] right-[-10%] h-[65%] w-[65%] rounded-full bg-brand-glow opacity-50 blur-3xl" />
					<div className="absolute bottom-[-30%] left-[20%] h-[70%] w-[70%] rounded-full bg-brand-accent opacity-45 blur-3xl" />
					<div className="absolute right-[10%] bottom-[-20%] h-[60%] w-[60%] rounded-full bg-brand opacity-40 blur-3xl" />
				</div>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle,#fff_1px,transparent_1px)] bg-size-[3px_3px] opacity-[0.06]"
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle,#fff_1px,transparent_1px)] bg-size-[5px_5px] opacity-[0.04]"
				/>
				{children}
			</div>
		);
	},
);

AuroraBackground.displayName = "AuroraBackground";

export { AuroraBackground };
export default AuroraBackground;
