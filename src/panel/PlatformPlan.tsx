"use client";

import {
	CheckCircleIcon,
	CubeIcon,
	CurrencyDollarIcon,
	UsersIcon,
} from "@phosphor-icons/react";
import { CONCEPT, PLAN } from "@/panel/concept";
import { usePlatformDjs } from "@/panel/usePlatformDjs";
import {
	CopyButton,
	MetricCard,
	PageContainer,
	PageHeader,
	StatusBadge,
} from "@/panel/ui";

export default function PlatformPlan() {
	const { djs } = usePlatformDjs();
	const activeCount = djs.filter((dj) => dj.status === "active").length;

	return (
		<PageContainer>
			<PageHeader
				eyebrow="Operación"
				title="Plan"
				subtitle="Un solo plan todo incluido: página, seguridad y hosting. El dominio se cobra al costo."
				badge={<StatusBadge tone="emerald">Activo</StatusBadge>}
			/>

			<section className="stagger grid grid-cols-1 gap-3 sm:grid-cols-3">
				<MetricCard
					label="Setup inicial"
					value={`$${PLAN.setupUsd}`}
					suffix="USD"
					tone="neutral"
					icon={CubeIcon}
					delay={0}
					footer={<span>Pago único de puesta en marcha</span>}
				/>
				<MetricCard
					label="Mensualidad"
					value={`$${PLAN.priceUsd}`}
					suffix={`/ ${PLAN.cadence}`}
					tone="emerald"
					icon={CurrencyDollarIcon}
					delay={1}
					footer={<span>Hosting, SSL y panel DJ</span>}
				/>
				<MetricCard
					label="DJs activos"
					value={activeCount}
					tone="blue"
					icon={UsersIcon}
					delay={2}
					footer={<span>Suscritos a {PLAN.name}</span>}
				/>
			</section>

			<div className="card-shell">
				<div className="card-panel p-6 space-y-5">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-grayscale-3/80 pb-4 dark:border-white/[0.08]">
						<div>
							<span className="section-label block">Plan vigente</span>
							<h2 className="mt-1 text-[15px] font-semibold text-grayscale-12">
								{PLAN.name}
							</h2>
						</div>
						<div className="flex items-center gap-2">
							<span className="rounded-md bg-grayscale-2 px-2.5 py-1 font-mono text-[11px] font-medium text-grayscale-11">
								todo-incluido
							</span>
							<CopyButton text="todo-incluido" label="Copiar ID" />
						</div>
					</div>

					<div>
						<span className="section-label mb-3 block">Qué incluye</span>
						<div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
							{PLAN.includes.map((item) => (
								<div
									key={item}
									className="surface-soft flex items-start gap-2.5 p-3.5 text-[12.5px] text-grayscale-12"
								>
									<CheckCircleIcon
										size={15}
										weight="fill"
										className="mt-0.5 shrink-0 text-green-9"
									/>
									<span className="leading-relaxed">{item}</span>
								</div>
							))}
						</div>
					</div>

					<div className="surface-soft p-4 text-[12.5px] leading-relaxed text-grayscale-10">
						<strong className="text-grayscale-12">Modelo operativo:</strong>{" "}
						{CONCEPT.model}
					</div>
				</div>
				<div className="px-6 py-2.5 text-[11.5px] text-grayscale-9">
					{PLAN.domainNote}
				</div>
			</div>
		</PageContainer>
	);
}
