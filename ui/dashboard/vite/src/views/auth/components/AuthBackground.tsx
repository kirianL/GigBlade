import type { ReactNode } from "react";

interface AuthBackgroundProps {
	children: ReactNode;
}

export function AuthBackground({ children }: AuthBackgroundProps) {
	const siteUrl =
		(import.meta.env.VITE_GIGBLADE_SITE_URL as string | undefined)?.replace(
			/\/$/,
			"",
		) || "http://localhost:3000";

	return (
		<div className="flex min-h-dvh bg-[#09090b] text-white">
			<div className="relative hidden min-h-dvh w-1/2 overflow-hidden lg:block">
				<img
					src="/auth-art.jpg"
					alt=""
					className="absolute inset-0 h-full w-full object-cover"
				/>
				<a
					href={siteUrl}
					className="absolute bottom-6 left-6 font-sans text-[18px] font-medium tracking-[-0.03em] text-white"
				>
					GigBlade
				</a>
			</div>

			<div className="flex min-h-dvh min-w-0 flex-1 flex-col">
				<header className="flex h-14 shrink-0 items-center justify-between px-5 pt-[env(safe-area-inset-top)] lg:hidden">
					<a
						href={siteUrl}
						className="font-sans text-[18px] font-medium tracking-[-0.03em] text-white"
					>
						GigBlade
					</a>
					<a
						href={`${siteUrl}/acceso`}
						className="text-sm text-white/45 transition-colors duration-160 hover:text-white"
					>
						Creá tu página
					</a>
				</header>

				<div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-5 py-8 sm:items-center sm:px-8 sm:py-10">
					<div className="w-full max-w-[350px]">{children}</div>
				</div>
			</div>
		</div>
	);
}
