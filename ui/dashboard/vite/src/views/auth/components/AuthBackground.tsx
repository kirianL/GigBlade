import { useEffect, type ReactNode } from "react";
import { gigbladeMarketingSiteUrl } from "@/gigblade/concept";

const AUTH_BACKGROUND = "#09090b";

interface AuthBackgroundProps {
	children: ReactNode;
}

export function AuthBackground({ children }: AuthBackgroundProps) {
	const siteUrl = gigbladeMarketingSiteUrl();

	useEffect(() => {
		const root = document.documentElement;
		const { body } = document;
		const app = document.getElementById("root");
		const previous = {
			html: root.style.backgroundColor,
			body: body.style.backgroundColor,
			app: app?.style.backgroundColor ?? "",
		};
		const metas = [...document.querySelectorAll('meta[name="theme-color"]')];
		const previousColors = metas.map((meta) => meta.getAttribute("content"));

		root.style.backgroundColor = AUTH_BACKGROUND;
		body.style.backgroundColor = AUTH_BACKGROUND;
		if (app) app.style.backgroundColor = AUTH_BACKGROUND;
		for (const meta of metas) meta.setAttribute("content", AUTH_BACKGROUND);

		return () => {
			root.style.backgroundColor = previous.html;
			body.style.backgroundColor = previous.body;
			if (app) app.style.backgroundColor = previous.app;
			metas.forEach((meta, index) => {
				const color = previousColors[index];
				if (color) meta.setAttribute("content", color);
			});
		};
	}, []);

	return (
		<div className="relative flex min-h-dvh bg-[#09090b] text-white">
			<div
				aria-hidden
				className="pointer-events-none fixed inset-0 bg-[#09090b]"
			/>
			<div className="relative flex min-h-dvh w-full">
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
						GigBlades
					</a>
				</div>

				<div className="flex min-h-dvh min-w-0 flex-1 flex-col">
					<header className="gigblade-safe-header flex shrink-0 items-center justify-between px-5 lg:hidden">
						<a
							href={siteUrl}
							className="font-sans text-[18px] font-medium tracking-[-0.03em] text-white"
						>
							GigBlades
						</a>
						<a
							href={`${siteUrl}/acceso`}
							className="text-sm text-white/45 transition-colors duration-160 hover:text-white"
						>
							Creá tu página
						</a>
					</header>

					<div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-5 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:items-center sm:px-8 sm:py-10">
						<div className="w-full max-w-[350px]">{children}</div>
					</div>
				</div>
			</div>
		</div>
	);
}
