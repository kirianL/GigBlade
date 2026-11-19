"use client";

import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import { CreateDjButton } from "@/panel/CreateDjButton";
import { DeleteDjButton } from "@/panel/DeleteDjButton";
import { DjsTable } from "@/panel/DjsTable";
import { djPublicUrl } from "@/panel/concept";
import { usePlatformDjs } from "@/panel/usePlatformDjs";
import { useLanguage } from "@/panel/LanguageProvider";
import { useSession } from "@/panel/auth-client";
import { PageContainer, PageHeader } from "@/panel/ui";

export default function PlatformDjs() {
	const { djs, status, remove, add } = usePlatformDjs();
	const { data: session } = useSession();
	const { t } = useLanguage();
	const isPlatform =
		(session?.user as { role?: string } | undefined)?.role === "platform";

	return (
		<PageContainer>
			<PageHeader
				title={t("djs.title", "Directorio de DJs")}
				subtitle="Administración de cuentas activas, páginas publicadas y accesos al estudio"
			>
				{isPlatform ? <CreateDjButton onCreated={add} /> : null}
			</PageHeader>

			<DjsTable
				djs={djs}
				isLoading={status === "loading"}
				emptyStateText={
					status === "error"
						? "No se pudieron cargar los DJs. Recargá la página."
						: t("djs.empty", "Todavía no hay DJs.")
				}
				rowActions={(dj) => {
					const publicUrl = djPublicUrl(dj) || (dj.domain ? `https://${dj.domain}` : null);
					return (
						<div className="flex flex-wrap items-center gap-1.5">
							{publicUrl ? (
								<a
									href={publicUrl}
									target="_blank"
									rel="noreferrer"
									className="inline-flex h-8 items-center gap-1 px-3 border border-grayscale-4 bg-grayscale-1 hover:bg-grayscale-2 text-[12px] font-medium text-grayscale-11 hover:text-grayscale-12 dark:bg-grayscale-2 dark:hover:bg-grayscale-3 rounded-md transition-colors shadow-[0_1px_2px_rgba(28,22,16,0.04)]"
								>
									<ExternalLink size={12} />
									<span>{t("action.view", "Ver")}</span>
								</a>
							) : null}

							<Link
								href={`/studio/content?dj=${dj.slug}`}
								className="inline-flex h-8 items-center gap-1 px-3 border border-grayscale-4 bg-grayscale-1 hover:bg-grayscale-2 text-[12px] font-medium text-grayscale-11 hover:text-grayscale-12 dark:bg-grayscale-2 dark:hover:bg-grayscale-3 rounded-md transition-colors shadow-[0_1px_2px_rgba(28,22,16,0.04)]"
							>
								<Pencil size={12} />
								<span>{t("action.edit", "Editar")}</span>
							</Link>

							<Link
								href={`/studio?dj=${dj.slug}`}
								className="inline-flex h-8 items-center gap-1 px-3 bg-grayscale-12 hover:bg-grayscale-11 text-[12px] font-medium text-grayscale-1 rounded-md transition-colors shadow-[0_1px_2px_rgba(28,22,16,0.14)]"
							>
								<span>{t("action.open", "Abrir")}</span>
							</Link>

							{isPlatform ? (
								<DeleteDjButton
									slug={dj.slug}
									name={dj.name}
									onDeleted={remove}
								/>
							) : null}
						</div>
					);
				}}
			/>
		</PageContainer>
	);
}
