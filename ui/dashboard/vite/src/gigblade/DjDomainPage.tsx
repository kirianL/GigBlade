import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@autumn/ui";
import {
  ArrowsClockwiseIcon,
  ArrowSquareOutIcon,
  CaretDownIcon,
  CheckCircleIcon,
  CopyIcon,
  GlobeIcon,
  InfoIcon,
  PencilSimpleIcon,
  TrashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { djIntendedDomain, djPublicUrl } from "@/gigblade/concept";
import { ConnectDomainModal } from "@/gigblade/ConnectDomainModal";
import {
  CloudflareLogo,
  GenericServerLogo,
  GoDaddyLogo,
  GoogleDomainsLogo,
  NamecheapLogo,
  NamecomLogo,
  ProviderBrandLogo,
  VercelLogo,
} from "@/gigblade/ProviderLogos";
import { checkDomainDns, type DomainDnsScanResult } from "@/gigblade/site-api";
import {
  DjSelect,
  OpenPublicPageButton,
  PageContainer,
  useSelectedDj,
} from "@/gigblade/ui";
import { useLanguage } from "@/contexts/LanguageProvider";
import { usePlatformDomains } from "@/gigblade/usePlatformDomains";

function CopyButtonMini({
  value,
  label = "valor",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`Copiado ${label}: ${value}`);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="h-6 w-6 rounded-md text-tertiary-foreground hover:text-foreground hover:bg-interactive-secondary transition-all active:scale-90 inline-flex items-center justify-center shrink-0 cursor-pointer"
      title={`Copiar ${label}`}
      aria-label={`Copiar ${label}`}
    >
      {copied ? (
        <CheckCircleIcon
          size={13}
          weight="fill"
          className="text-emerald-500 animate-in zoom-in-75 duration-150"
        />
      ) : (
        <CopyIcon size={12} />
      )}
    </button>
  );
}

function isApex(hostname: string): boolean {
  const clean = hostname.replace(/^https?:\/\//, "").split("/")[0];
  return clean.split(".").length === 2;
}

function getDefaultRecords(hostname: string) {
  const clean = hostname.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
  if (isApex(clean)) {
    return [
      { type: "A", name: "@", value: "76.76.21.21" },
      { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
    ];
  }
  const sub = clean.split(".")[0] || "@";
  return [{ type: "CNAME", name: sub, value: "cname.vercel-dns.com" }];
}

const DOMAIN_PROVIDERS = [
  { id: "cloudflare", label: "Cloudflare" },
  { id: "godaddy", label: "GoDaddy" },
  { id: "namecom", label: "Name.com" },
  { id: "namecheap", label: "Namecheap" },
  { id: "google", label: "Google Domains" },
  { id: "vercel", label: "Vercel DNS" },
  { id: "other", label: "Registrador externo" },
] as const;

type ProviderId = (typeof DOMAIN_PROVIDERS)[number]["id"];

export default function DjDomainPage() {
  const { dj, setDj } = useSelectedDj();
  const { t } = useLanguage();
  const pageUrl = djPublicUrl(dj);
  const customDomain = djIntendedDomain(dj);

  const [scan, setScan] = useState<DomainDnsScanResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedProvider, setSelectedProvider] = useState<ProviderId>(() => {
    if (typeof window !== "undefined" && customDomain) {
      const stored = window.localStorage.getItem(`gigblade_provider_${customDomain}`);
      if (stored) return stored as ProviderId;
    }
    // Default to cloudflare so user immediately sees the provider logo as requested
    return "cloudflare";
  });

  const { verifyDomain, isVerifying, removeDomain } = usePlatformDomains();

  const handleSelectProvider = (provId: ProviderId) => {
    setSelectedProvider(provId);
    if (typeof window !== "undefined" && customDomain) {
      window.localStorage.setItem(`gigblade_provider_${customDomain}`, provId);
    }
    const label = DOMAIN_PROVIDERS.find((p) => p.id === provId)?.label || provId;
    toast.success(`Registrador: ${label}`);
  };

  const handleCheck = async (domainToScan: string) => {
    setIsChecking(true);
    try {
      const res = await checkDomainDns({ domain: domainToScan });
      setScan(res);
      if (res.provider && res.provider !== "other") {
        const stored = typeof window !== "undefined" ? window.localStorage.getItem(`gigblade_provider_${domainToScan}`) : null;
        if (!stored) {
          setSelectedProvider(res.provider as ProviderId);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (customDomain) {
      void handleCheck(customDomain);
    } else {
      setScan(null);
    }
  }, [customDomain]);

  const handleVerify = async () => {
    if (!customDomain) return;
    try {
      await verifyDomain(customDomain);
      toast.success(`Dominio ${customDomain} verificado.`);
      void handleCheck(customDomain);
    } catch {
      toast.error(`No se pudo verificar ${customDomain}.`);
    }
  };

  const handleDeleteDomain = async () => {
    if (!customDomain) return;
    setIsDeleting(true);
    try {
      await removeDomain({ domain: customDomain, slug: dj.slug });
      toast.success(`Dominio ${customDomain} desconectado.`);
      setDeleteDialogOpen(false);
      window.location.reload();
    } catch {
      toast.error(`No se pudo desconectar el dominio ${customDomain}.`);
    } finally {
      setIsDeleting(false);
    }
  };

  const effectiveProvider = selectedProvider;
  const effectiveProviderLabel =
    DOMAIN_PROVIDERS.find((p) => p.id === effectiveProvider)?.label || "Cloudflare";

  const activeRecords =
    scan?.recommendedRecords && scan.recommendedRecords.length > 0
      ? scan.recommendedRecords
      : customDomain
      ? getDefaultRecords(customDomain)
      : [];

  const providerHelperTip = (() => {
    switch (effectiveProvider) {
      case "cloudflare":
        return t(
          "djDomain.tipCloudflare",
          "Cloudflare detectado: Configura el registro en modo 'Solo DNS' (nube gris, sin proxy naranja) para que Vercel pueda emitir el SSL automáticamente.",
        );
      case "godaddy":
        return t(
          "djDomain.tipGodaddy",
          "GoDaddy detectado: Ve a 'Administrar DNS' ➔ 'Agregar nuevo registro'. En 'Nombre' coloca el host ('@', 'dj' o '_vercel') y en 'Valor' pega el destino.",
        );
      case "namecom":
        return t(
          "djDomain.tipNamecom",
          "Name.com detectado: Ve a 'DNS Records'. En 'Host' coloca únicamente el nombre (ej. 'dj' o '_vercel') sin el dominio, y en 'TTL' 300.",
        );
      case "namecheap":
        return t(
          "djDomain.tipNamecheap",
          "Namecheap detectado: Ve a 'Advanced DNS' ➔ 'Add New Record'. Coloca el Host y el Valor indicados con TTL Automático.",
        );
      case "vercel":
        return t(
          "djDomain.tipVercel",
          "Vercel DNS detectado: Configura estos registros en la sección DNS de tu cuenta.",
        );
      default:
        return t(
          "djDomain.tipGeneric",
          "Agrega estos registros en la zona DNS de tu registrador para conectar tu página y emitir el certificado SSL seguro.",
        );
    }
  })();

  const handleCopyAllRecords = () => {
    if (!activeRecords.length || !customDomain) return;
    const lines = [
      `Configuración DNS para ${customDomain}:`,
      ...activeRecords.map(
        (r, idx) =>
          `${idx + 1}. Tipo: ${r.type} | Host / Nombre: ${r.name} | Valor / Destino: ${r.value} | TTL: 300 / Auto`,
      ),
      "",
      "Nota: En el campo Host escribe únicamente lo indicado (tu registrador añade automáticamente el resto del dominio).",
    ];
    void navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Todos los registros copiados al portapapeles");
  };

  return (
    <PageContainer>
      {/* Top Bar with Breadcrumbs & DJ selector */}
      <div className="flex flex-wrap items-center justify-between w-full gap-2 sm:gap-4">
        <Breadcrumb className="text-tertiary-foreground flex justify-start min-w-0">
          <BreadcrumbList className="text-tertiary-foreground text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/studio?dj=${dj.slug}`}>{t("nav.myPage", "Mi página")}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{t("nav.domain", "Dominio")}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-2 min-w-0 max-w-full">
          <DjSelect value={dj.slug} onValueChange={setDj} />
          <OpenPublicPageButton href={pageUrl} />
        </div>
      </div>

      {/* Main Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3 mt-1">
        <div>
          <div className="flex items-center gap-2">
            <GlobeIcon size={18} weight="bold" className="text-foreground" />
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              {t("djDomain.title", "Dominio propio")}
            </h1>
          </div>
          <p className="text-xs text-tertiary-foreground mt-0.5 max-w-2xl">
            {t("djDomain.subtitle", "Gestiona la conexión DNS de tu marca con cualquier registrador.")}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ConnectDomainModal
            fixedSlug={dj.slug}
            initialDomain={customDomain || undefined}
            triggerText={customDomain ? t("djDomain.changeDomain", "Cambiar dominio") : t("djDomain.connectDomain", "Conectar dominio")}
            triggerVariant={customDomain ? "secondary" : "primary"}
            triggerIcon={
              customDomain ? <PencilSimpleIcon size={13} /> : undefined
            }
            triggerClassName="h-8 px-3 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all"
            onConnected={() => {
              window.location.reload();
            }}
          />
        </div>
      </div>

      {/* Domain Status Card */}
      {customDomain ? (
        <div className="border border-border/80 rounded-xl bg-card overflow-hidden divide-y divide-border/60 shadow-sm mt-2 transition-all">
          {/* Header Row: Authentic Brand Logo, Domain, Dynamic Live Status, Action Group: Ver, Editar, Verificar, Eliminar */}
          <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 bg-interactive-secondary/15">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-background border border-border/70 flex items-center justify-center shrink-0 shadow-2xs">
                <ProviderBrandLogo
                  provider={effectiveProvider}
                  className="w-5 h-5 shrink-0"
                />
              </div>

              <div className="min-w-0 flex flex-col justify-center">
                {/* Domain name with micro-link to live URL */}
                <div className="flex items-center gap-2">
                  <a
                    href={`https://${customDomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-1.5 font-semibold text-base text-foreground font-mono hover:text-primary transition-colors"
                  >
                    <span>{customDomain}</span>
                    <ArrowSquareOutIcon
                      size={13}
                      className="text-tertiary-foreground group-hover:text-primary transition-colors shrink-0"
                    />
                  </a>
                </div>

                {/* Minimalist inline status & interactive registrar selector */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-tertiary-foreground mt-0.5">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          scan?.pointsToGigBlade
                            ? "bg-emerald-400"
                            : "bg-amber-400"
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          scan?.pointsToGigBlade
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      />
                    </span>
                    <span className="text-foreground font-medium text-xs">
                      {scan?.pointsToGigBlade ? t("djDomain.connected", "Conectado") : t("djDomain.pendingDns", "Pendiente de DNS")}
                    </span>
                  </span>

                  <span className="text-border">·</span>

                  {/* Interactive Registrar Dropdown Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 -my-0.5 rounded-md hover:bg-interactive-secondary border border-border/40 hover:border-border transition-all text-foreground font-medium text-xs cursor-pointer group"
                        title={t("djDomain.changeRegistrar", "Cambiar registrador detectado")}
                      >
                        <ProviderBrandLogo provider={effectiveProvider} className="w-3.5 h-3.5 shrink-0" />
                        <span>{effectiveProviderLabel}</span>
                        <CaretDownIcon size={11} className="text-tertiary-foreground group-hover:text-foreground transition-transform" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-52">
                      <div className="px-2 py-1.5 text-[11px] font-semibold text-tertiary-foreground tracking-tight">
                        {t("djDomain.domainRegistrar", "Registrador de dominio")}
                      </div>
                      <DropdownMenuSeparator />
                      {DOMAIN_PROVIDERS.map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          onClick={() => handleSelectProvider(p.id)}
                          className="flex items-center justify-between cursor-pointer py-1.5"
                        >
                          <div className="flex items-center gap-2">
                            <ProviderBrandLogo provider={p.id} className="w-3.5 h-3.5 shrink-0" />
                            <span className={effectiveProvider === p.id ? "font-semibold text-foreground" : "text-muted-foreground"}>
                              {p.label}
                            </span>
                          </div>
                          {effectiveProvider === p.id && (
                            <CheckCircleIcon size={14} weight="fill" className="text-emerald-500" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {scan?.nameservers?.[0] ? (
                    <span className="font-mono text-tertiary-foreground hidden md:inline">
                      ({scan.nameservers[0]})
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Standardized h-8 action buttons: Ver, Editar, Verificar, Eliminar */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
              {/* 1. VER */}
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="h-8 px-3 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all"
                title={t("action.viewSite", "Ver sitio")}
              >
                <a
                  href={`https://${customDomain}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ArrowSquareOutIcon size={13} />
                  <span>{t("action.viewSite", "Ver sitio")}</span>
                </a>
              </Button>

              {/* 2. EDITAR */}
              <ConnectDomainModal
                fixedSlug={dj.slug}
                initialDomain={customDomain}
                triggerText={t("action.edit", "Editar")}
                triggerVariant="secondary"
                triggerIcon={<PencilSimpleIcon size={13} />}
                triggerClassName="h-8 px-3 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all"
                onConnected={() => {
                  window.location.reload();
                }}
              />

              {/* 3. VERIFICAR CONEXIÓN */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleVerify}
                disabled={isVerifying || isChecking}
                className="h-8 px-3 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all"
                title={t("action.verify", "Verificar")}
              >
                <ArrowsClockwiseIcon
                  size={13}
                  className={isVerifying || isChecking ? "animate-spin" : ""}
                />
                <span>
                  {isVerifying ? t("action.verifying", "Verificando...") : t("action.verify", "Verificar")}
                </span>
              </Button>

              {/* Direct provider link if Cloudflare */}
              {effectiveProvider === "cloudflare" && (
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className="h-8 px-3 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all text-orange-600 dark:text-orange-400 hover:text-orange-700 hover:bg-orange-500/10"
                >
                  <a
                    href="https://dash.cloudflare.com/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <CloudflareLogo className="w-3.5 h-3.5 shrink-0" />
                    <span>{t("djDomain.openCloudflare", "Abrir Cloudflare")}</span>
                    <ArrowSquareOutIcon size={12} />
                  </a>
                </Button>
              )}

              {/* Direct provider link if GoDaddy */}
              {effectiveProvider === "godaddy" && (
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className="h-8 px-3 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:bg-teal-500/10"
                >
                  <a
                    href={scan?.oneClickUrl || `https://dcc.godaddy.com/manage-dns?domain=${customDomain}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <GoDaddyLogo className="w-3.5 h-3.5 shrink-0" />
                    <span>GoDaddy DNS</span>
                    <ArrowSquareOutIcon size={12} />
                  </a>
                </Button>
              )}

              {/* Direct provider link if Name.com */}
              {effectiveProvider === "namecom" && (
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className="h-8 px-3 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all"
                >
                  <a
                    href="https://www.name.com/account/domain"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <NamecomLogo className="w-3.5 h-3.5 shrink-0" />
                    <span>{t("djDomain.openNamecom", "Abrir Name.com")}</span>
                    <ArrowSquareOutIcon size={12} />
                  </a>
                </Button>
              )}

              {/* Direct provider link if Namecheap */}
              {effectiveProvider === "namecheap" && (
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className="h-8 px-3 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all text-orange-600 dark:text-orange-400 hover:text-orange-700 hover:bg-orange-500/10"
                >
                  <a
                    href="https://ap.www.namecheap.com/Domains/DomainControlPanel"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <NamecheapLogo className="w-3.5 h-3.5 shrink-0" />
                    <span>{t("djDomain.openNamecheap", "Abrir Namecheap")}</span>
                    <ArrowSquareOutIcon size={12} />
                  </a>
                </Button>
              )}

              {/* Direct provider link if Vercel */}
              {effectiveProvider === "vercel" && (
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className="h-8 px-3 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all"
                >
                  <a
                    href="https://vercel.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <VercelLogo className="w-3.5 h-3.5 shrink-0" />
                    <span>{t("djDomain.openVercel", "Abrir Vercel")}</span>
                    <ArrowSquareOutIcon size={12} />
                  </a>
                </Button>
              )}

              {/* 4. ELIMINAR / DESCONECTAR */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
                className="h-8 px-3 text-xs font-medium gap-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 active:scale-[0.98] transition-all"
                title={t("action.delete", "Eliminar")}
              >
                <TrashIcon size={13} />
                <span>{t("action.delete", "Eliminar")}</span>
              </Button>
            </div>
          </div>

          {/* Dynamic Registrar Context Helper */}
          <div className="px-4 sm:px-5 py-2.5 bg-interactive-secondary/10 flex items-center gap-2 text-xs text-tertiary-foreground">
            <InfoIcon size={14} className="shrink-0 text-foreground/70" />
            <span className="leading-relaxed">{providerHelperTip}</span>
          </div>

          {/* Minimalist DNS Records Table & Automation Instructions */}
          <div className="p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-foreground tracking-tight">
                  {t("domains.dnsRequired", "Registros DNS requeridos")}
                </span>
                <p className="text-[11px] text-tertiary-foreground mt-0.5">
                  Copia y pega estos registros exactos en la zona DNS de tu proveedor de dominio.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyAllRecords}
                  className="h-7 px-2.5 text-[11px] font-medium gap-1.5 active:scale-[0.98] transition-all"
                >
                  <CopyIcon size={12} />
                  <span>Copiar configuración completa</span>
                </Button>
                <span className="text-[11px] text-tertiary-foreground font-mono bg-interactive-secondary px-2 py-0.5 rounded">
                  TTL: 300 / Auto
                </span>
              </div>
            </div>

            <div className="border border-border/80 rounded-lg overflow-x-auto bg-background">
              <table className="w-full min-w-[320px] text-xs text-left">
                <thead className="bg-interactive-secondary/30 border-b border-border text-[11px] font-mono text-tertiary-foreground">
                  <tr>
                    <th className="px-2.5 sm:px-3.5 py-2.5 font-medium w-16 sm:w-20">{t("djDomain.tableType", "TIPO")}</th>
                    <th className="px-2.5 sm:px-3.5 py-2.5 font-medium w-28 sm:w-36">{t("djDomain.tableName", "NOMBRE / HOST")}</th>
                    <th className="px-2.5 sm:px-3.5 py-2.5 font-medium">{t("djDomain.tableValue", "VALOR / DESTINO")}</th>
                    <th className="px-3.5 py-2.5 font-medium hidden md:table-cell w-44">PROPÓSITO</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border/60 font-mono">
                  {activeRecords.map((rec, i) => {
                    const isTxt = rec.type.toUpperCase() === "TXT";
                    const purpose = isTxt
                      ? "Verificación SSL de Vercel"
                      : rec.type === "A"
                      ? "Dirección IP del servidor"
                      : rec.name === "www"
                      ? "Redirección www"
                      : "Enrutamiento principal";

                    return (
                      <tr
                        key={i}
                        className={`hover:bg-interactive-secondary/20 transition-colors ${
                          isTxt ? "bg-amber-500/5 dark:bg-amber-500/10" : ""
                        }`}
                      >
                        <td className="px-2.5 sm:px-3.5 py-2.5 font-semibold text-foreground">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                              isTxt
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                : "bg-interactive-secondary text-foreground"
                            }`}
                          >
                            {rec.type}
                          </span>
                        </td>
                        <td className="px-2.5 sm:px-3.5 py-2.5 text-foreground">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold break-all">{rec.name}</span>
                            <CopyButtonMini value={rec.name} label="Nombre/Host" />
                          </div>
                        </td>
                        <td className="px-2.5 sm:px-3.5 py-2.5 text-foreground break-all select-all font-mono">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs">{rec.value}</span>
                            <CopyButtonMini value={rec.value} label="Valor" />
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 text-[11px] text-tertiary-foreground font-sans hidden md:table-cell">
                          {isTxt ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                              {purpose}
                            </span>
                          ) : (
                            <span>{purpose}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Automation 3-Step Guide Callout */}
            <div className="bg-interactive-secondary/30 border border-border/80 rounded-lg p-3.5 flex flex-col gap-2.5 text-xs text-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-[11px] font-bold">
                  i
                </span>
                <span>Pasos para automatizar y activar tu dominio en minutos:</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-2.5 text-[11px] text-tertiary-foreground mt-0.5">
                <div className="bg-background/80 border border-border/60 rounded p-2.5 flex flex-col gap-1">
                  <p className="font-semibold text-foreground">1. Accede al DNS</p>
                  <p className="leading-relaxed">
                    Entra al gestor DNS de tu proveedor ({effectiveProviderLabel}) en la zona de tu dominio.
                  </p>
                </div>

                <div className="bg-background/80 border border-border/60 rounded p-2.5 flex flex-col gap-1">
                  <p className="font-semibold text-foreground">2. Copia los registros</p>
                  <p className="leading-relaxed">
                    {effectiveProvider === "cloudflare" ? (
                      <>
                        Borra los A, AAAA o CNAME que ya existan en <strong>@</strong> y <strong>www</strong>. Pega los de arriba con TTL Auto y deja la nube <strong>gris</strong> (DNS only). La nube naranja impide el SSL.
                      </>
                    ) : (
                      <>
                        Pega el <strong>Host</strong> y el <strong>Valor</strong> arriba indicados con TTL 300 o automático. Borra los A o AAAA anteriores del mismo host.
                      </>
                    )}
                  </p>
                </div>

                <div className="bg-background/80 border border-border/60 rounded p-2.5 flex flex-col gap-1">
                  <p className="font-semibold text-foreground">3. Verifica con 1 clic</p>
                  <p className="leading-relaxed">
                    Pulsa el botón <strong>&quot;Verificar&quot;</strong> arriba. GigBlades y Vercel emitirán tu certificado SSL automáticamente.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-tertiary-foreground border-t border-border/60 pt-2 leading-relaxed">
                <strong>Nota sobre el campo Nombre/Host:</strong> En Name.com, GoDaddy y Cloudflare, escribe <strong>únicamente el prefijo</strong> (por ejemplo <code className="bg-interactive-secondary px-1 py-0.5 rounded text-foreground font-mono">dj</code> o <code className="bg-interactive-secondary px-1 py-0.5 rounded text-foreground font-mono">_vercel</code> o <code className="bg-interactive-secondary px-1 py-0.5 rounded text-foreground font-mono">@</code>). Tu registrador añade tu dominio raíz automáticamente.
              </p>
            </div>

            <p className="text-[11px] text-tertiary-foreground leading-relaxed">
              {t(
                "djDomain.propagationFootnote",
                "La propagación global de DNS suele tardar entre 2 y 10 minutos después de guardar los registros en tu registrador.",
              )}
            </p>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="border border-border/80 rounded-xl bg-card p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-4 mt-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-interactive-secondary/60 border border-border flex items-center justify-center text-foreground">
            <GlobeIcon size={20} weight="bold" />
          </div>
          <div className="max-w-md">
            <h2 className="text-sm font-semibold text-foreground">
              {t("djDomain.emptyTitle", "Aún no tienes un dominio propio conectado")}
            </h2>
            <p className="text-xs text-tertiary-foreground mt-1.5 leading-relaxed">
              {t("djDomain.emptyDesc", "Actualmente tu sitio responde en la dirección temporal de GigBlades. Conecta tu propio dominio en 1 solo clic para lucir 100% profesional.")}
            </p>
          </div>
          <ConnectDomainModal
            fixedSlug={dj.slug}
            triggerText={t("djDomain.emptyButton", "Conectar mi dominio en 1 clic")}
            triggerVariant="primary"
            triggerClassName="h-8 px-3.5 text-xs font-medium gap-1.5 active:scale-[0.98] transition-all shadow-sm"
            onConnected={() => {
              window.location.reload();
            }}
          />
        </div>
      )}

      {/* Confirmation Dialog: Desconectar / Eliminar Dominio */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md p-5 bg-card border border-border text-card-foreground shadow-xl rounded-xl">
          <DialogHeader className="space-y-1 pb-1">
            <div className="flex items-center gap-2 text-rose-500">
              <WarningCircleIcon size={18} weight="bold" />
              <DialogTitle className="text-sm font-semibold tracking-tight text-foreground">
                {t("djDomain.disconnectTitle", "Desconectar dominio propio")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-tertiary-foreground leading-normal">
              {t("djDomain.disconnectDesc", "¿Estás seguro de que deseas desconectar el dominio de tu página? Tu sitio web volverá a responder en la dirección temporal de GigBlades.")}{" "}
              <strong className="text-foreground font-mono">{customDomain}</strong>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteDialogOpen(false)}
              className="h-9 sm:h-8 px-3 text-xs font-medium active:scale-[0.98] transition-all"
            >
              {t("action.cancel", "Cancelar")}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteDomain}
              className="h-9 sm:h-8 px-3 text-xs font-medium bg-red-600 hover:bg-red-700 text-white gap-1.5 active:scale-[0.98] transition-all"
            >
              <TrashIcon size={13} weight="bold" />
              <span>
                {isDeleting ? t("djDomain.disconnecting", "Desconectando...") : t("djDomain.disconnectConfirm", "Desconectar dominio")}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
