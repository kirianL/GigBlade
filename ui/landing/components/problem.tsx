import Image from "next/image";

export default function Problem() {
	return (
		<section className="bg-[#000000]">
			<div className="bg-[#0D0D0D] flex flex-col">
				<div className="flex flex-col gap-3 pl-[28px] xl:pl-[90px] pr-6 xl:pr-[90px] pt-14 sm:pt-16 xl:pt-16">
					<h2 className="font-normal tracking-[-4%] leading-[32px] xl:leading-[40px] mb-2 xl:mb-4">
						<span className="block text-[#686868] text-[30px] md:text-[36px] xl:text-[40px]">
							Decile adiós a
						</span>
						<span className="block text-white text-[30px] md:text-[36px] xl:text-[40px]">
							los DMs sueltos.
						</span>
					</h2>
					<p className="text-[#888888] font-light text-[16px] md:text-[18px] xl:text-[16px] tracking-[-2%] leading-[20px] mb-10 max-w-xl">
						Sin página propia, tu imagen queda repartida entre redes.
						Armar el sitio por tu cuenta implica hosting y seguridad.
						<span className="text-white">
							{" "}
							GigBlades publica tu página y se ocupa de eso. El dominio lo
							comprás vos.
						</span>
					</p>
				</div>

				<div className="mt-auto">
					<div className="grid grid-cols-1 sm:grid-cols-3 border-t border-b border-[#1E1E1E] xl:pl-[66px]">
						{[
							{
								title: "Imagen.",
								description:
									"Un lugar formal con tu estética, no un perfil más en una red de terceros.",
							},
							{
								title: "Canal.",
								description:
									"En la página van tu bio, tus fotos, tus redes y un formulario de bookings.",
							},
							{
								title: "Cero infra.",
								description:
									"Hosting y seguridad van en la mensualidad. El dominio no va incluido.",
							},
						].map((stat, i) => (
							<div
								key={stat.title}
								className={`py-6 pr-9 pl-4 xl:pl-6 border-[#292929] ${
									i < 2
										? "border-b sm:border-b-0 sm:border-r"
										: ""
								}`}
							>
								<p className="text-white tracking-[-5%] font-normal text-[16px] xl:text-[18px] leading-none">
									{stat.title}
								</p>
								<p className="text-[#767676] font-light tracking-[-5%] text-[14px] xl:text-[15px] mt-1.5 leading-[18px] max-w-sm">
									{stat.description}
								</p>
							</div>
						))}
					</div>

					<div className="hidden h-auto w-full cursor-pointer transition-all duration-300 hover:brightness-125 hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] md:block">
						<Image
							src="/images/problems/problembg.png"
							alt="Problem Background"
							width={621}
							height={223}
							sizes="(max-width: 1280px) 100vw, 720px"
							loading="lazy"
							className="h-auto w-full"
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
