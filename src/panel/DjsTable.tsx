"use client";

import {
	ArrowRightIcon,
	GlobeIcon,
	MagnifyingGlassIcon,
	UsersIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { djDomainLabel, type GigbladeDj } from "@/panel/concept";
import { Skeleton } from "@/panel/Skeleton";
import {
	DjStatusCell,
	EmptyState,
	PanelInput,
	SegmentedControl,
} from "@/panel/ui";

export function DjsTable({
	djs,
	isLoading = false,
	showSearch = true,
	emptyStateText,
	getRowHref,
	rowActions,
}: {
	djs: GigbladeDj[];
	isLoading?: boolean;
	showSearch?: boolean;
	emptyStateText?: string;
	getRowHref?: (dj: GigbladeDj) => string;
	rowActions?: (dj: GigbladeDj) => ReactNode;
}) {
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		"all" | "active" | "canceled"
	>("all");

	const counts = useMemo(
		() => ({
			all: djs.length,
			active: djs.filter((dj) => dj.status === "active").length,
			canceled: djs.filter((dj) => dj.status === "canceled").length,
		}),
		[djs],
	);

	const filtered = useMemo(() => {
		return djs.filter((dj) => {
			if (statusFilter !== "all" && dj.status !== statusFilter) return false;
			if (!query.trim()) return true;
			const needle = query.trim().toLowerCase();
			return (
				dj.name.toLowerCase().includes(needle) ||
				dj.slug.toLowerCase().includes(needle) ||
				dj.email.toLowerCase().includes(needle) ||
				dj.domain.toLowerCase().includes(needle)
			);
		});
	}, [djs, query, statusFilter]);

	return (
		<div className="space-y-4">
			{showSearch ? (
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<SegmentedControl
						value={statusFilter}
						onChange={setStatusFilter}
						ariaLabel="Filtrar DJs por estado"
						options={[
							{ value: "all", label: "Todos", count: counts.all },
							{ value: "active", label: "Activos", count: counts.active },
							{
								value: "canceled",
								label: "Suspendidos",
								count: counts.canceled,
							},
						]}
					/>
					<div className="relative w-full sm:w-64">
						<MagnifyingGlassIcon
							size={14}
							className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-grayscale-8"
						/>
						<PanelInput
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Buscar por nombre, slug o dominio…"
							className="pl-9"
						/>
					</div>
				</div>
			) : null}

			{isLoading ? (
				<div className="grid grid-cols-1 gap-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-24 rounded-xl" />
					))}
				</div>
			) : filtered.length === 0 ? (
				<EmptyState
					icon={<UsersIcon size={20} />}
					title={emptyStateText ?? "No hay DJs registrados"}
					description="Cuando agregues un DJ o apruebes una solicitud de la lista de espera, aparecerá aquí."
				/>
			) : (
				<div className="stagger grid grid-cols-1 gap-3">
					{filtered.map((dj) => {
						const href = getRowHref?.(dj);
						const card = (
							<article className="card-shell card-shell-hover">
								{/* Panel superior (identico a SolicitudCard de base-main) */}
								<div className="card-panel p-4">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0 flex-1">
											<h3 className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-grayscale-12">
												{dj.name}
											</h3>
											<div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] text-grayscale-9">
												<span className="font-medium text-grayscale-10">
													@{dj.slug}
												</span>
												<span
													aria-hidden
													className="text-grayscale-5 dark:text-white/20"
												>
													|
												</span>
												<span className="inline-flex min-w-0 items-center gap-1 font-sans text-[11.5px] text-grayscale-9">
													<GlobeIcon
														size={12}
														className="shrink-0 text-grayscale-8"
													/>
													<span className="truncate">{djDomainLabel(dj)}</span>
												</span>
											</div>
										</div>
										<DjStatusCell status={dj.status} />
									</div>
								</div>

								{/* Franja inferior dual-tone (identico a SolicitudCard de base-main) */}
								<div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-[11px] text-grayscale-10">
									<span className="truncate font-mono text-[11px] text-grayscale-9">
										{dj.email || "Sin correo registrado"}
									</span>

									<div>
										{rowActions ? (
											rowActions(dj)
										) : href ? (
											<span className="flex shrink-0 items-center gap-1 font-mono text-[11.5px] font-medium text-grayscale-10 transition-colors duration-150 group-hover:text-grayscale-12">
												Abrir estudio
												<ArrowRightIcon
													size={11}
													className="transition-transform duration-150 ease-[var(--ease-out-soft)] group-hover:translate-x-0.5"
												/>
											</span>
										) : null}
									</div>
								</div>
							</article>
						);

						if (href && !rowActions) {
							return (
								<Link key={dj.slug} href={href} className="group block">
									{card}
								</Link>
							);
						}
						return <div key={dj.slug}>{card}</div>;
					})}
				</div>
			)}
		</div>
	);
}
