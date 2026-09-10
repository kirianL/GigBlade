import { ProblemBgSvg } from "../app/constant";

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
						Sin sitio propio dependés de Instagram y WhatsApp para mostrarte y
						recibir bookings. Armarlo por tu cuenta es hosting, dominio y
						seguridad.
						<span className="text-white">
							{" "}
							GigBlade lo deja listo, sin que tengas que saber de eso.
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
									"Las productoras te encuentran y dejan una solicitud. Vos la ves en el panel.",
							},
							{
								title: "Cero infra.",
								description:
									"Hosting, dominio y seguridad los corre la plataforma. Un solo motor, costo bajo.",
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

					<ProblemBgSvg />
				</div>
			</div>
		</section>
	);
}
