import type { ReactNode } from "react";

const pageRows = [
	{ label: "DOMINIO PROPIO", active: true },
	{ label: "PLANTILLA PARA DJS", active: false },
	{ label: "BIO, FOTOS Y REDES", active: false },
	{ label: "FORMULARIO DE BOOKING", active: false },
	{ label: "HOSTING Y SEGURIDAD", active: false },
];

function Connector() {
	return (
		<div
			className="h-8 w-px bg-brand-accent/45 lg:h-px lg:w-16 lg:bg-transparent lg:border-t lg:border-dashed lg:border-brand-accent/60"
			aria-hidden="true"
		/>
	);
}

function Glyph({ children }: { children: ReactNode }) {
	return (
		<div className="relative h-40 w-40 shrink-0 border border-brand-accent bg-[#0F081F] md:h-[200px] md:w-[200px]">
			<div
				className="pointer-events-none absolute inset-[14px] border border-brand-accent/45"
				aria-hidden="true"
			/>
			<div
				className="pointer-events-none absolute inset-[14px] bg-[radial-gradient(circle_at_32%_22%,rgba(126,186,255,0.38),transparent_64%)]"
				aria-hidden="true"
			/>
			<div className="relative z-10 flex h-full w-full items-center justify-center">
				{children}
			</div>
		</div>
	);
}

function Node({
	label,
	badge,
	children,
}: {
	label: string;
	badge?: string;
	children: ReactNode;
}) {
	return (
		<div className="flex flex-col items-center gap-3">
			<p className="font-mono text-[10px] tracking-[0.18em] text-[#FFFFFF66]">
				{label}
			</p>
			{children}
			{badge ? (
				<span className="border border-[#292929] bg-[#141414] px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-[#FFFFFF99]">
					{badge}
				</span>
			) : null}
		</div>
	);
}

export default function Solution() {
	return (
		<section className="relative w-full overflow-hidden bg-[#000000] pt-16 md:pt-24">
			<div
				className="pointer-events-none absolute inset-0 z-0"
				aria-hidden="true"
				style={{
					backgroundImage:
						"linear-gradient(to right, rgba(128,128,128,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.07) 1px, transparent 1px)",
					backgroundSize: "40px 40px",
					maskImage:
						"linear-gradient(to bottom, transparent 0%, black 18%, black 78%, transparent 100%)",
					WebkitMaskImage:
						"linear-gradient(to bottom, transparent 0%, black 18%, black 78%, transparent 100%)",
				}}
			/>

			<div className="relative z-10 mx-auto flex max-w-[1400px] flex-col items-center px-4">
				<div className="mb-10 flex flex-col items-center text-center lg:mb-4">
					<h2 className="mb-6 text-[30px] leading-[30px] font-normal tracking-tight md:text-[40px] md:leading-[40px]">
						<span className="text-[#A3A3A3]">Tu página, </span>
						<span className="text-white">en un solo motor</span>
					</h2>
					<p className="max-w-2xl text-[14px] leading-[20px] font-light tracking-[-2%] text-[#A3A3A3] md:text-[16px] sm:text-base">
						Elegís plan y dominio, una plantilla del catálogo y tu contenido.
						<br className="hidden sm:block" />
						GigBlade administra el resto.{" "}
						<span className="text-white">
							Tu página queda lista para bookings.
						</span>
					</p>
				</div>

				<div
					className="grid w-full max-w-[1100px] grid-cols-1 items-center justify-items-center gap-0 pb-16 pt-2 lg:grid-cols-[1fr_auto_1.15fr_auto_1fr] lg:gap-2 lg:pb-20 lg:pt-6"
					aria-hidden="true"
				>
					<Node label="TU CONTENIDO" badge="MIX">
						<Glyph>
							<span className="font-sans text-[28px] tracking-[-4%] text-brand-glow md:text-[34px]">
								SET
							</span>
						</Glyph>
					</Node>

					<Connector />

					<Node label="TU PÁGINA">
						<div className="w-full max-w-[320px] overflow-hidden border border-brand-accent bg-brand-ink">
							<div className="flex items-center gap-2 border-b border-brand-accent px-4 py-3">
								<span className="h-2 w-2 bg-brand-glow" />
								<span className="font-mono text-[12px] tracking-[0.16em] text-white">
									GIGBLADE
								</span>
							</div>
							<ul>
								{pageRows.map((row) => (
									<li
										key={row.label}
										className={`border-b border-brand-ink px-4 py-3 font-mono text-[11px] tracking-[0.08em] last:border-b-0 ${
											row.active
												? "bg-brand-glow/15 text-white"
												: "text-[#FFFFFF66]"
										}`}
									>
										{row.active ? "> " : ""}
										{row.label}
									</li>
								))}
							</ul>
						</div>
					</Node>

					<Connector />

					<Node label="LA PLATAFORMA" badge="LISTO">
						<Glyph>
							<span className="font-sans text-[16px] tracking-[0.12em] text-brand-glow md:text-[18px]">
								HOST
							</span>
						</Glyph>
					</Node>
				</div>
			</div>
		</section>
	);
}
