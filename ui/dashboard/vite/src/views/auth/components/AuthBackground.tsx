import type { ReactNode } from "react";
import { GigBladeMark } from "./GigBladeMark";

interface AuthBackgroundProps {
	children: ReactNode;
}

export function AuthBackground({ children }: AuthBackgroundProps) {
	return (
		<div className="h-screen bg-background flex">
			<div className="hidden lg:block relative w-1/2 overflow-hidden border-r border-[#292929] bg-[#0F0F0F]">
				<div
					className="pointer-events-none absolute -left-24 top-[-20%] h-[70%] w-[70%] rounded-full blur-[120px]"
					style={{ background: "rgba(26, 86, 214, 0.28)" }}
					aria-hidden="true"
				/>
				<div
					className="pointer-events-none absolute right-[-10%] bottom-[-30%] h-[55%] w-[55%] rounded-full blur-[140px]"
					style={{ background: "rgba(126, 186, 255, 0.16)" }}
					aria-hidden="true"
				/>
				<div
					className="absolute inset-0 flex justify-end gap-3 pr-0"
					aria-hidden="true"
				>
					{Array.from({ length: 16 }, (_, i) => (
						<div
							key={i}
							className="h-full w-px shrink-0 bg-[#292929]"
							style={{ opacity: 0.35 + (i % 4) * 0.08 }}
						/>
					))}
				</div>
				<div className="absolute inset-0 flex flex-col justify-end p-8">
					<GigBladeMark className="text-[28px] text-white" />
					<p className="mt-2 max-w-[280px] text-sm text-white/60">
						Página, dominio y booking para DJs.
					</p>
				</div>
			</div>

			<div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
				<div className="w-full max-w-[350px]">{children}</div>
			</div>
		</div>
	);
}
