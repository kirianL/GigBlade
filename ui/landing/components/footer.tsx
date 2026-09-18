import type { ReactNode } from "react";
import AppLink from "./app-link";

function FooterStripLink({ href, label }: { href: string; label: string }) {
	return (
		<AppLink
			href={href}
			className="group/strip relative inline-flex shrink-0 items-center text-[12px] leading-none font-mono uppercase tracking-[-0.02em] md:text-[14px]"
		>
			<span className="text-[#FFFFFF99] transition-colors duration-300 group-hover/strip:text-white">
				{label}
			</span>
			<span
				className="pointer-events-none absolute inset-y-0 left-0 flex w-full origin-left scale-x-0 items-center overflow-hidden bg-white text-black transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/strip:scale-x-100 group-active/strip:scale-x-100"
				aria-hidden="true"
			>
				<span className="whitespace-nowrap">{label}</span>
			</span>
		</AppLink>
	);
}

function FooterDot() {
	return (
		<span
			aria-hidden="true"
			className="size-[5px] shrink-0 bg-white"
		/>
	);
}

function FooterRail({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	return (
		<div className="flex h-12 min-w-0 items-stretch md:h-14">
			<div className="flex shrink-0 items-center whitespace-nowrap border-r border-[#292929] px-4 text-[12px] leading-none font-mono uppercase tracking-[-0.02em] md:px-6 md:text-[14px]">
				{label}
			</div>
			<div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto px-4 whitespace-nowrap md:gap-4 md:px-6 md:border-r md:border-[#292929]">
				{children}
			</div>
		</div>
	);
}

export default function Footer() {
	return (
		<footer
			style={{
				width: "calc(100% + var(--page-pad) * 2)",
				marginLeft: "calc(var(--page-pad) * -1)",
				paddingLeft: "var(--page-pad)",
				paddingRight: "var(--page-pad)",
			}}
			className="relative mt-[50px] grid overflow-hidden border-t border-[#292929] bg-[#000000] text-[#FFFFFF99]"
		>
			<div className="relative z-10 col-start-1 row-start-1 flex w-full flex-col">
				<div className="relative flex min-h-[300px] w-full flex-col justify-between md:min-h-[400px]">
					<div className="pointer-events-none absolute right-0 bottom-0 left-0 z-0 h-[300px] bg-[url('/images/footer/footerbg.svg')] bg-cover bg-bottom bg-no-repeat opacity-70 sm:h-[550px] sm:bg-contain lg:h-[400px]" />

					<div className="relative z-10 flex flex-col justify-between gap-10 pt-8 pr-4 pb-16 pl-4.5 sm:pr-8 md:gap-16 md:pt-24 md:pb-16 lg:flex-row lg:gap-8 lg:pr-12 xl:pl-[90px]">
						<div className="flex max-w-sm flex-col">
							<AppLink
								href="/"
								className="mb-3 inline-block font-sans text-[24px] font-medium tracking-[-3%] text-white md:mb-6 md:text-[32px]"
							>
								GigBlade
							</AppLink>
							<p className="text-[14px] leading-[18px] font-light tracking-[-2%] text-[#FFFFFF99] md:text-[16px] md:leading-[20px]">
								GigBlade es presencia digital para DJs: página y dominio, sin
								tocar lo técnico.
							</p>
						</div>
					</div>
				</div>

				<div className="relative z-10 w-full border-y border-[#292929] bg-black/40 backdrop-blur-md">
					<div className="flex flex-col md:flex-row md:items-stretch">
						<FooterRail label="IR A">
							<FooterStripLink href="/#ejemplos" label="EJEMPLOS" />
							<FooterDot />
							<FooterStripLink href="/pricing" label="PRECIOS" />
							<FooterDot />
							<FooterStripLink href="/acceso" label="ACCESO" />
							<FooterDot />
							<FooterStripLink href="/login" label="ENTRAR" />
						</FooterRail>

						<FooterRail label="LEGAL">
							<FooterStripLink href="/terms" label="TERMS" />
							<FooterDot />
							<FooterStripLink href="/privacy" label="PRIVACY" />
						</FooterRail>

						<div className="flex h-12 min-w-0 flex-1 items-center md:h-14">
							<p className="min-w-0 flex-1 truncate px-4 text-left text-[11px] leading-none font-mono tracking-[-0.02em] text-[#FFFFFF99] md:px-6 md:text-right md:text-[13px] lg:text-[14px]">
								Copyright © 2026 GigBlade. Todos los derechos reservados
							</p>
							<div
								aria-hidden="true"
								className="hidden h-full shrink-0 items-stretch gap-3 pr-3 lg:flex"
							>
								{Array.from({ length: 10 }, (_, index) => (
									<span
										key={index}
										className="border-r border-[#292929]"
									/>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
