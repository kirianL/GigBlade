"use client";

import dynamic from "next/dynamic";
import { useMediaQuery } from "@/lib/use-media-query";

const ProductionScaleMotion = dynamic(
	() => import("./production-scale-motion"),
	{ ssr: false },
);

const cards = [
	{
		tint: "bg-brand-tint-1",
		icon: "/images/production/uptime2.svg",
		metric: "$65",
		label: "Al mes, todo incluido",
		description:
			"Hosting, seguridad, página y dominio propio en una sola suscripción.",
		clipart: true,
	},
	{
		tint: "bg-brand-tint-2",
		icon: "/images/production/latency.svg",
		metric: "Cache",
		label: "Carga rápida",
		description:
			"Tu página se sirve desde cache la mayor parte del tiempo. Quien te busca no espera.",
		clipart: true,
	},
	{
		tint: "bg-brand-tint-3",
		icon: "/images/production/uptiime.svg",
		metric: "Al costo",
		label: "Dominio anual",
		description:
			"La renovación del dominio se cobra transparente, al costo real, sin margen.",
		clipart: true,
	},
	{
		tint: "bg-brand-tint-4",
		icon: "/images/production/churn.svg",
		metric: "Aislado",
		label: "Tus datos",
		description:
			"Cada DJ tiene sus datos separados. El mismo estándar de seguridad protege a todos.",
		clipart: true,
	},
];

function ProductionCards() {
	return (
		<section className="ps-section flex flex-col items-start justify-between gap-12 bg-[#0F0F0F] py-12 lg:flex-row lg:gap-0 lg:py-16">
			<div className="my-auto flex w-full flex-col gap-4 px-4 pt-2 lg:w-auto lg:gap-6 xl:pl-22.5 lg:pr-0">
				<div className="leading-none lg:leading-10">
					<p className="text-[30px] font-normal tracking-[-4%] text-[#FFFFFF99] lg:text-[40px]">
						Estás en
					</p>
					<h2 className="mt-1 text-[30px] font-normal tracking-[-4%] text-white lg:mt-0 lg:text-[40px]">
						buenas manos
					</h2>
				</div>
				<p className="text-[16px] leading-[20px] font-light text-[#FFFFFF99] lg:w-sm lg:text-sm lg:leading-5">
					Un motor compartido, el mismo estándar de seguridad para cada DJ.{" "}
					<span className="text-white">
						Vos te ocupás de tu set
						<br className="hidden lg:block" /> y de tu imagen. Lo técnico queda
						de este lado.
					</span>
				</p>
			</div>

			<div className="flex w-full flex-col items-end gap-3 pl-6 lg:w-[50%] lg:gap-4 lg:pl-0 [--card-step:24px] lg:[--card-step:52px]">
				{cards.map((card, i) => (
					<div
						key={card.metric}
						className={`ps-card relative flex items-center justify-between gap-2 py-4 pr-3 pl-4 lg:gap-6 lg:py-3.5 lg:pr-10 lg:pl-6 ${card.tint}`}
						style={{
							width: `calc(100% - (var(--card-step) * ${i}))`,
						}}
					>
						<div className="flex min-w-[95px] shrink-0 flex-col gap-1 lg:min-w-auto">
							<div className="flex items-center gap-1.5 lg:gap-2">
								<img
									src={card.icon}
									width={18}
									height={18}
									alt=""
									className="h-[14px] w-[14px] lg:h-[18px] lg:w-[18px]"
								/>
								<span className="ps-metric text-xl font-medium tracking-[-5%] text-brand-ink lg:text-2xl">
									{card.metric}
								</span>
							</div>
							<span className="text-[11px] leading-[1] font-normal tracking-[-2%] text-brand-ink/60 lg:text-[14px] lg:leading-4.5">
								{card.label}
							</span>
						</div>

						<p className="flex-1 text-left text-[10.5px] leading-[1.3] font-normal tracking-[0] text-brand-ink/80 lg:w-66 lg:flex-none lg:shrink-0 lg:text-[14px] lg:leading-4.5 lg:tracking-[-2%]">
							{card.description}
						</p>

						{card.clipart && (
							<img
								src="/images/production/clipart.svg"
								width={12}
								height={12}
								alt=""
								className="absolute right-0 bottom-0 max-lg:h-[8px] max-lg:w-[8px]"
							/>
						)}
					</div>
				))}
			</div>
		</section>
	);
}

export default function ProductionScale() {
	const isLg = useMediaQuery("(min-width: 1024px)");
	const cardsView = <ProductionCards />;

	if (isLg) {
		return <ProductionScaleMotion>{cardsView}</ProductionScaleMotion>;
	}

	return <div className="overflow-hidden">{cardsView}</div>;
}
