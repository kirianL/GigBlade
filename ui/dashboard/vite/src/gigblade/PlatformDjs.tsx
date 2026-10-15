import { Button, PageContainer } from "@autumn/ui";
import { ArrowSquareOutIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { Link } from "react-router";
import { CreateDjButton } from "@/gigblade/CreateDjButton";
import { DeleteDjButton } from "@/gigblade/DeleteDjButton";
import { DjsTable } from "@/gigblade/DjsTable";
import { djPublicUrl } from "@/gigblade/concept";
import { usePlatformDjs } from "@/gigblade/usePlatformDjs";
import { useLanguage } from "@/contexts/LanguageProvider";
import { useSession } from "@/lib/auth-client";

export default function PlatformDjs() {
	const { djs, status, remove, add } = usePlatformDjs();
	const { data: session } = useSession();
	const { t } = useLanguage();
	const isPlatform =
		(session?.user as { role?: string } | undefined)?.role === "platform";

	return (
		<PageContainer>
			<DjsTable
				djs={djs}
				virtualize
				heading={t("djs.title", "Directorio de DJs")}
				isLoading={status === "loading"}
				emptyStateText={
					status === "error"
						? "No se pudieron cargar los DJs. Recargá la página."
						: t("djs.empty", "Todavía no hay DJs.")
				}
				actions={isPlatform ? <CreateDjButton onCreated={add} /> : null}
				rowActions={(dj) => {
					const publicUrl = djPublicUrl(dj) || `https://${dj.domain}`;
					return (
						<div className="flex items-center gap-1.5">
							{/* 1. VER */}
							<Button
								variant="secondary"
								size="sm"
								className="h-8 px-2.5 text-xs font-medium gap-1 active:scale-[0.98] transition-all"
								asChild
								title={t("action.viewSite", "Ver sitio")}
							>
								<a href={publicUrl} target="_blank" rel="noreferrer">
									<ArrowSquareOutIcon size={13} />
									<span>{t("action.view", "Ver")}</span>
								</a>
							</Button>

							{/* 2. EDITAR */}
							<Button
								variant="secondary"
								size="sm"
								className="h-8 px-2.5 text-xs font-medium gap-1 active:scale-[0.98] transition-all"
								asChild
								title={t("action.editContent", "Editar contenido")}
							>
								<Link to={`/studio/content?dj=${dj.slug}`}>
									<PencilSimpleIcon size={13} />
									<span>{t("action.edit", "Editar")}</span>
								</Link>
							</Button>

							{/* 3. ABRIR PANEL */}
							<Button
								variant="secondary"
								size="sm"
								className="h-8 px-2.5 text-xs font-medium active:scale-[0.98] transition-all"
								asChild
								title={t("action.studio", "Panel DJ")}
							>
								<Link to={`/studio?dj=${dj.slug}`}>
									<span>{t("action.open", "Abrir")}</span>
								</Link>
							</Button>

							{/* 4. ELIMINAR */}
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
