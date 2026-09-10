import Image from "next/image";

const pageRows = [
	{ label: "DOMINIO PROPIO", active: true },
	{ label: "PLANTILLA PARA DJS", active: false },
	{ label: "BIO, FOTOS Y REDES", active: false },
	{ label: "FORMULARIO DE BOOKING", active: false },
	{ label: "HOSTING Y SEGURIDAD", active: false },
];

export default function Solution() {
	return (
		<section className="relative w-full bg-[#000000] overflow-hidden pt-24">
			<div
				className="absolute inset-0 z-0 pointer-events-none"
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

			<div className="relative z-10 max-w-[1400px] mx-auto px-4 flex flex-col items-center">
				<div className="text-center mb-16 lg:mb-4 flex flex-col items-center">
					<h2 className="text-[30px] leading-[30px] md:text-[40px] md:leading-[40px] font-normal tracking-tight mb-6">
						<span className="text-[#A3A3A3]">Tu página, </span>
						<span className="text-white">en un solo motor</span>
					</h2>
					<p className="text-[#A3A3A3] text-[14px] md:text-[16px] sm:text-base max-w-2xl mx-auto font-light leading-[20px] tracking-[-2%]">
						Elegís plan y dominio, una plantilla del catálogo y tu contenido.
						<br className="hidden sm:block" />
						GigBlade administra el resto.{" "}
						<span className="text-white">
							Tu página queda lista para bookings.
						</span>
					</p>
				</div>

				<div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-[1fr_auto_1.15fr_auto_1fr] items-center gap-6 lg:gap-2 pb-20 pt-6">
					<div className="flex flex-col items-center gap-3">
						<p className="font-mono text-[10px] tracking-[0.18em] text-[#FFFFFF66]">
							TU CONTENIDO
						</p>
						<div className="relative w-[160px] h-[160px] md:w-[200px] md:h-[200px]">
							<Image
								src="/images/solutions/app.svg"
								alt=""
								fill
								className="object-contain"
							/>
							<span className="absolute left-1/2 top-1/2 flex h-[56%] w-[56%] -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-brand-ink font-sans text-[28px] md:text-[34px] tracking-[-4%] text-brand-glow">
								SET
							</span>
						</div>
						<span className="border border-[#292929] bg-[#141414] px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-[#FFFFFF99]">
							MIX
						</span>
					</div>

					<div className="hidden lg:flex items-center justify-center">
						<Image
							src="/images/solutions/dashedline-app.svg"
							alt=""
							width={80}
							height={14}
							className="h-auto w-20"
						/>
					</div>

					<div className="flex flex-col items-center gap-3 w-full">
						<p className="font-mono text-[10px] tracking-[0.18em] text-[#FFFFFF66]">
							TU PÁGINA
						</p>
						<div className="w-full max-w-[320px] border border-brand-accent bg-brand-ink overflow-hidden">
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
										className={`border-b border-brand-ink last:border-b-0 px-4 py-3 font-mono text-[11px] tracking-[0.08em] ${
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
					</div>

					<div className="hidden lg:flex items-center justify-center">
						<Image
							src="/images/solutions/dashedline-stripe.svg"
							alt=""
							width={80}
							height={14}
							className="h-auto w-20"
						/>
					</div>

					<div className="flex flex-col items-center gap-3">
						<p className="font-mono text-[10px] tracking-[0.18em] text-[#FFFFFF66]">
							LA PLATAFORMA
						</p>
						<div className="relative w-[160px] h-[160px] md:w-[200px] md:h-[200px]">
							<Image
								src="/images/solutions/stripe.svg"
								alt=""
								fill
								className="object-contain"
							/>
							<span className="absolute left-1/2 top-1/2 flex h-[56%] w-[56%] -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-brand-ink font-sans text-[16px] md:text-[18px] tracking-[0.12em] text-brand-glow">
								HOST
							</span>
						</div>
						<span className="border border-[#292929] bg-[#141414] px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-[#FFFFFF99]">
							LISTO
						</span>
					</div>
				</div>
			</div>
		</section>
	);
}
