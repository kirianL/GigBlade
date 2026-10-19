import {
  Button,
  MiniCopyButton,
  PageContainer,
  PageHeader,
} from "@autumn/ui";
import {
  ArrowSquareOutIcon,
  ArrowsClockwiseIcon,
  CaretDownIcon,
  CaretUpIcon,
  ChartBarIcon,
  CheckCircleIcon,
  GlobeIcon,
  LightningIcon,
  LockKeyIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  djDomainLabel,
  djIntendedDomain,
  djPublicUrl,
  formatLastVisit,
  formatVisitCount,
  PLAN,
} from "@/gigblade/concept";
import { ConnectDomainModal } from "@/gigblade/ConnectDomainModal";
import { DeleteDjButton } from "@/gigblade/DeleteDjButton";
import { GenerateDjPasswordButton } from "@/gigblade/GenerateDjPassword";
import { usePlatformDjs } from "@/gigblade/usePlatformDjs";
import { usePlatformDomains } from "@/gigblade/usePlatformDomains";
import { DjStatusCell, OpenPublicPageButton } from "@/gigblade/ui";
import { ProviderBrandLogo } from "@/gigblade/ProviderLogos";
import { useSession } from "@/lib/auth-client";
import { useLanguage } from "@/contexts/LanguageProvider";
import type { DomainAutomationDetail } from "@/gigblade/site-api";

type MergedDomainRow = {
  slug: string;
  name: string;
  email: string;
  hostname: string;
  publicDomain: string | null;
  preview: boolean;
  visits: number;
  lastVisitedAt: string | null;
  status: "active" | "trialing" | "canceled";
  automation?: DomainAutomationDetail;
};

export default function PlatformDomains() {
  const { djs, sites, remove } = usePlatformDjs();
  const {
    domains: automationList,
    verifyDomain,
    refetch,
    isRefetching,
  } = usePlatformDomains();

  const { data: session } = useSession();
  const { t } = useLanguage();
  const isPlatform =
    (session?.user as { role?: string } | undefined)?.role === "platform";

  const [expandedDetails, setExpandedDetails] = useState<
    Record<string, boolean>
  >({});
  const [verifyingMap, setVerifyingMap] = useState<Record<string, boolean>>({});

  const toggleDetails = (slug: string) => {
    setExpandedDetails((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const handleVerify = async (hostname: string) => {
    setVerifyingMap((prev) => ({ ...prev, [hostname]: true }));
    try {
      await verifyDomain(hostname);
      toast.success(`Dominio ${hostname} verificado.`);
    } catch {
      toast.error(`No se pudo verificar ${hostname}. Intenta nuevamente.`);
    } finally {
      setVerifyingMap((prev) => ({ ...prev, [hostname]: false }));
    }
  };

  const rows = useMemo<MergedDomainRow[]>(() => {
    const bySlug = new Map((sites ?? []).map((site) => [site.slug, site]));
    const autoByHost = new Map(
      automationList.map((auto) => [auto.hostname.toLowerCase(), auto]),
    );

    return djs.map((dj) => {
      const live = bySlug.get(dj.slug);
      const hostname = live?.domain || dj.domain;
      const publicDomain = djIntendedDomain({ domain: hostname });
      const automation =
        publicDomain ? autoByHost.get(publicDomain.toLowerCase()) : undefined;

      return {
        slug: dj.slug,
        name: live?.displayName || dj.name,
        email: live?.email || dj.email,
        hostname,
        publicDomain,
        preview: live?.preview ?? !publicDomain,
        visits: live?.visits ?? 0,
        lastVisitedAt: live?.lastVisitedAt ?? null,
        status: dj.status,
        automation,
      };
    });
  }, [djs, sites, automationList]);

  const totalVisits = rows.reduce((sum, row) => sum + row.visits, 0);
  const totalWithCustomDomain = rows.filter((r) => r.publicDomain).length;
  const activeOnline = rows.filter(
    (r) => r.automation?.status === "active" || (!r.preview && r.publicDomain),
  ).length;

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <PageHeader
            icon={
              <GlobeIcon
                size={18}
                weight="fill"
                className="text-primary"
                aria-hidden
              />
            }
            title={t("domains.headerTitle", "Centro de automatización de dominios")}
          />
          <p className="text-sm text-tertiary-foreground leading-6 -mt-2 max-w-3xl">
            {PLAN.domainNote} Cada DJ puede usar su propio dominio comprado en
            GoDaddy, Cloudflare u otro registrador con conexión en 1 clic.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            disabled={isRefetching}
            className="gap-1.5 h-9 sm:h-8 px-3 text-xs font-medium justify-center active:scale-[0.98] transition-all"
          >
            <ArrowsClockwiseIcon
              size={13}
              className={isRefetching ? "animate-spin" : ""}
            />
            {isRefetching ? "Actualizando..." : "Re-escanear"}
          </Button>

          {isPlatform && (
            <ConnectDomainModal
              onConnected={() => void refetch()}
              triggerClassName="gap-1.5 h-9 sm:h-8 text-xs font-medium px-3 justify-center active:scale-[0.98] transition-all"
            />
          )}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
        <div className="border rounded-lg p-3 bg-interactive-secondary/40">
          <p className="text-xs text-tertiary-foreground">DJs Registrados</p>
          <p className="text-lg font-semibold text-foreground mt-0.5">
            {rows.length}
          </p>
        </div>
        <div className="border rounded-lg p-3 bg-interactive-secondary/40">
          <p className="text-xs text-tertiary-foreground">Dominios Propios</p>
          <p className="text-lg font-semibold text-foreground mt-0.5">
            {totalWithCustomDomain}
          </p>
        </div>
        <div className="border rounded-lg p-3 bg-interactive-secondary/40">
          <p className="text-xs text-tertiary-foreground">En Línea con SSL</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <LockKeyIcon size={14} className="text-emerald-500" weight="fill" />
            <p className="text-lg font-semibold text-foreground">
              {activeOnline}
            </p>
          </div>
        </div>
        <div className="border rounded-lg p-3 bg-interactive-secondary/40">
          <p className="text-xs text-tertiary-foreground">Visitas Globales</p>
          <p className="text-lg font-semibold text-foreground mt-0.5">
            {formatVisitCount(totalVisits)}
          </p>
        </div>
      </div>

      {/* Domain List */}
      <ul className="flex flex-col gap-4 mt-1">
        {rows.length === 0 ? (
          <li className="border rounded-lg bg-interactive-secondary p-4 text-sm text-tertiary-foreground">
            Todavía no hay DJs creados.
          </li>
        ) : null}

        {rows.map((row) => {
          const pageUrl = djPublicUrl({ slug: row.slug, domain: row.hostname });
          const domainLabel =
            row.publicDomain ?? djDomainLabel({ domain: row.hostname });
          const isExpanded = Boolean(expandedDetails[row.slug]);
          const isVerifying = Boolean(verifyingMap[row.publicDomain ?? ""]);
          const auto = row.automation;

          const isGodaddy = auto?.provider === "godaddy";
          const isCloudflare = auto?.provider === "cloudflare";
          const providerLabel = auto?.providerLabel ?? (row.publicDomain ? "Detectando..." : "GigBlade Preview");

          return (
            <li
              key={row.slug}
              className="border rounded-lg bg-interactive-secondary/80 p-4 sm:p-5 flex flex-col gap-4 transition-all"
            >
              {/* Header Info */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-base font-semibold text-foreground truncate">
                      {row.name}
                    </p>
                    <DjStatusCell status={row.status} />
                    {row.publicDomain && (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded border border-border bg-interactive-secondary/60 text-foreground font-medium">
                        <ProviderBrandLogo
                          provider={auto?.provider}
                          nameserverDomain={
                            auto?.nameservers?.[0]
                              ? auto.nameservers[0].split(".").slice(-2).join(".")
                              : undefined
                          }
                          className="w-3.5 h-3.5 shrink-0"
                        />
                        {providerLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-sm text-foreground break-all font-medium">
                      {domainLabel}
                    </p>
                    {row.publicDomain && (
                      <MiniCopyButton text={row.publicDomain} />
                    )}
                  </div>

                  <p className="mt-1 text-xs text-tertiary-foreground">
                    {row.preview
                      ? "Dominio en preparación · Servido temporalmente desde GigBlade"
                      : "Dominio propio conectado · Producción"}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {formatVisitCount(row.visits)} visitas
                  </p>
                  <p className="text-xs text-subtle">
                    {formatLastVisit(row.lastVisitedAt)}
                  </p>
                </div>
              </div>

              {/* 4-Step Automation Pipeline Visualizer */}
              {row.publicDomain && (
                <div className="bg-background/60 border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-foreground">
                      {t("domains.pipelineTitle", "Pipeline de automatización")}
                    </span>
                    <span className="text-xs text-tertiary-foreground">
                      {auto?.pointsToGigBlade
                        ? "Tráfico enrutado a GigBlade"
                        : "Esperando propagación de DNS"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {/* Step 1: Vercel Project */}
                    <div className="flex items-center gap-1.5 p-2 rounded bg-interactive-secondary/60">
                      {auto?.vercelVerified ? (
                        <CheckCircleIcon
                          size={15}
                          weight="fill"
                          className="text-emerald-500 shrink-0"
                        />
                      ) : (
                        <WarningCircleIcon
                          size={15}
                          weight="fill"
                          className="text-amber-500 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">1. Vercel API</p>
                        <p className="text-[10px] text-tertiary-foreground">
                          {auto?.vercelVerified ? "Alta confirmada" : "Pendiente en Vercel"}
                        </p>
                      </div>
                    </div>

                    {/* Step 2: DNS Target */}
                    <div className="flex items-center gap-1.5 p-2 rounded bg-interactive-secondary/60">
                      {auto?.pointsToGigBlade ? (
                        <CheckCircleIcon
                          size={15}
                          weight="fill"
                          className="text-emerald-500 shrink-0"
                        />
                      ) : (
                        <WarningCircleIcon
                          size={15}
                          weight="fill"
                          className="text-amber-500 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">2. DNS Radar</p>
                        <p className="text-[10px] text-tertiary-foreground">
                          {auto?.pointsToGigBlade
                            ? "76.76.21.21 OK"
                            : "Falta apuntar"}
                        </p>
                      </div>
                    </div>

                    {/* Step 3: SSL Certificate */}
                    <div className="flex items-center gap-1.5 p-2 rounded bg-interactive-secondary/60">
                      {auto?.sslActive ? (
                        <CheckCircleIcon
                          size={15}
                          weight="fill"
                          className="text-emerald-500 shrink-0"
                        />
                      ) : (
                        <ShieldCheckIcon
                          size={15}
                          weight="fill"
                          className="text-blue-500 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">3. SSL HTTPS</p>
                        <p className="text-[10px] text-tertiary-foreground">
                          {auto?.sslActive ? "Emitido" : "En emisión"}
                        </p>
                      </div>
                    </div>

                    {/* Step 4: Edge Config Sync */}
                    <div className="flex items-center gap-1.5 p-2 rounded bg-interactive-secondary/60">
                      <CheckCircleIcon
                        size={15}
                        weight="fill"
                        className="text-emerald-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">4. Edge Config</p>
                        <p className="text-[10px] text-tertiary-foreground">
                          Proxy enrutado
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-border/50">
                {/* Acciones principales del Dominio (Izquierda) */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Instant Verification Button */}
                  {row.publicDomain && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleVerify(row.publicDomain!)}
                      disabled={isVerifying}
                      className="h-8 px-2.5 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all"
                    >
                      <ArrowsClockwiseIcon
                        size={13}
                        className={isVerifying ? "animate-spin" : ""}
                      />
                      <span>{isVerifying ? "Verificando..." : "Re-verificar ahora"}</span>
                    </Button>
                  )}

                  {/* Ver / Ocultar registros DNS */}
                  {row.publicDomain && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleDetails(row.slug)}
                      className="h-8 px-2.5 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all"
                    >
                      {isExpanded ? (
                        <>
                          <CaretUpIcon size={12} />
                          <span>{t("action.hideDns", "Ocultar DNS")}</span>
                        </>
                      ) : (
                        <>
                          <CaretDownIcon size={12} />
                          <span>{t("action.showDns", "Ver registros DNS")}</span>
                        </>
                      )}
                    </Button>
                  )}

                  {/* Abrir página */}
                  <OpenPublicPageButton
                    href={pageUrl}
                    className="h-8 px-2.5 text-xs font-medium gap-1.5"
                  />

                  {/* GoDaddy 1-Click Fast Connect Button */}
                  {isGodaddy && auto?.oneClickUrl && !auto.pointsToGigBlade && (
                    <Button
                      variant="primary"
                      size="sm"
                      asChild
                      className="h-8 px-2.5 text-xs font-medium gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      <a
                        href={auto.oneClickUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <LightningIcon size={13} weight="fill" />
                        <span>1-Clic GoDaddy</span>
                      </a>
                    </Button>
                  )}

                  {/* Cloudflare Quick Link */}
                  {isCloudflare && !auto?.pointsToGigBlade && (
                    <Button
                      variant="secondary"
                      size="sm"
                      asChild
                      className="h-8 px-2.5 text-xs font-medium gap-1.5 text-orange-500"
                    >
                      <a
                        href="https://dash.cloudflare.com/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ArrowSquareOutIcon size={13} />
                        <span>Abrir Cloudflare DNS</span>
                      </a>
                    </Button>
                  )}
                </div>

                {/* Acciones de gestión y navegación del DJ (Derecha) */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all"
                    asChild
                  >
                    <Link to={`/studio?dj=${row.slug}`}>
                      <PencilSimpleIcon size={13} />
                      <span>{t("action.studio", "Panel DJ")}</span>
                    </Link>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all"
                    asChild
                  >
                    <Link to={`/studio/visitas?dj=${row.slug}`}>
                      <ChartBarIcon size={13} />
                      <span>{t("action.viewVisits", "Ver visitas")}</span>
                    </Link>
                  </Button>

                  {isPlatform ? (
                    <GenerateDjPasswordButton
                      slug={row.slug}
                      email={row.email}
                      name={row.name}
                      className="h-8 px-2.5 text-xs font-medium gap-1.5"
                    />
                  ) : null}

                  {isPlatform ? (
                    <DeleteDjButton
                      slug={row.slug}
                      name={row.name}
                      onDeleted={remove}
                      className="h-8 px-2.5 text-xs font-medium gap-1.5"
                    />
                  ) : null}
                </div>
              </div>

              {/* Collapsible DNS Records Inspector */}
              {isExpanded && row.publicDomain && (
                <div className="bg-background/90 border rounded-lg p-4 flex flex-col gap-3 text-xs mt-1 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-semibold text-foreground">
                      {t("domains.networkDetails", "Detalles de red y DNS")} para {row.publicDomain}
                    </span>
                    <span className="text-tertiary-foreground font-mono">
                      Target: 76.76.21.21
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-tertiary-foreground mb-1">
                        IPs actuales detectadas:
                      </p>
                      <p className="font-mono bg-interactive-secondary p-1.5 rounded text-foreground">
                        {auto?.currentIps.length
                          ? auto.currentIps.join(", ")
                          : "Ninguna (no resuelve aún)"}
                      </p>
                    </div>

                    <div>
                      <p className="text-tertiary-foreground mb-1">
                        Servidores de nombres (NS):
                      </p>
                      <p className="font-mono bg-interactive-secondary p-1.5 rounded text-foreground truncate">
                        {auto?.nameservers.length
                          ? auto.nameservers.join(", ")
                          : "No detectados"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-tertiary-foreground mb-1.5 font-medium">
                      Registros requeridos si se configuran manualmente:
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {auto?.recommendedRecords && auto.recommendedRecords.length > 0 ? (
                        auto.recommendedRecords.map((rec, idx) => {
                          const isTxt = rec.type.toUpperCase() === "TXT";
                          return (
                            <div
                              key={idx}
                              className={`flex flex-wrap items-center justify-between p-2 rounded gap-2 ${
                                isTxt
                                  ? "bg-amber-500/10 border border-amber-500/30"
                                  : "bg-interactive-secondary"
                              }`}
                            >
                              <div className="flex items-center gap-2 font-mono text-xs">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    isTxt
                                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                      : "bg-background text-foreground"
                                  }`}
                                >
                                  {rec.type}
                                </span>
                                <span>
                                  Host: <strong>{rec.name}</strong> ➔ {rec.value}
                                </span>
                                {isTxt && (
                                  <span className="text-[10px] font-sans text-amber-600 dark:text-amber-400 font-medium">
                                    (Verificación SSL Vercel)
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] text-tertiary-foreground">Host:</span>
                                <MiniCopyButton text={rec.name} />
                                <span className="text-[10px] text-tertiary-foreground ml-1">Valor:</span>
                                <MiniCopyButton text={rec.value} />
                              </div>
                            </div>
                          );
                        })
                      ) : row.publicDomain.split(".").length > 2 ? (
                        <div className="flex items-center justify-between bg-interactive-secondary p-2 rounded">
                          <span className="font-mono">
                            <strong>CNAME</strong> {row.publicDomain.split(".")[0]} ➔ cname.vercel-dns.com
                          </span>
                          <MiniCopyButton text="cname.vercel-dns.com" />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between bg-interactive-secondary p-2 rounded">
                            <span className="font-mono">
                              <strong>A</strong> @ ➔ 76.76.21.21
                            </span>
                            <MiniCopyButton text="76.76.21.21" />
                          </div>
                          <div className="flex items-center justify-between bg-interactive-secondary p-2 rounded">
                            <span className="font-mono">
                              <strong>CNAME</strong> www ➔ cname.vercel-dns.com
                            </span>
                            <MiniCopyButton text="cname.vercel-dns.com" />
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-[10px] text-tertiary-foreground mt-2 leading-relaxed">
                      <strong>Nota:</strong> En Name.com, GoDaddy y Cloudflare, escribe en el campo <em>Host</em> solo el prefijo (ej. <code className="bg-interactive-secondary px-1 py-0.5 rounded font-mono text-foreground">dj</code> o <code className="bg-interactive-secondary px-1 py-0.5 rounded font-mono text-foreground">_vercel</code> o <code className="bg-interactive-secondary px-1 py-0.5 rounded font-mono text-foreground">@</code>). Tu proveedor añade automáticamente el dominio raíz.
                    </p>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </PageContainer>
  );
}
