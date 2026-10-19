import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@autumn/ui";
import {
  ArrowSquareOutIcon,
  ArrowsClockwiseIcon,
  CheckIcon,
  CopyIcon,
  GlobeIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { usePlatformDjs } from "@/gigblade/usePlatformDjs";
import { usePlatformDomains } from "@/gigblade/usePlatformDomains";
import type { DomainDnsScanResult } from "@/gigblade/site-api";
import { ProviderBrandLogo } from "@/gigblade/ProviderLogos";
import { useLanguage } from "@/contexts/LanguageProvider";

function CopyCellButton({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const handleCopy = () => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${t("action.copied", "Copiado")} ${label ? label + ": " : ""}${value}`);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="h-6 w-6 rounded text-tertiary-foreground hover:text-foreground hover:bg-interactive-secondary transition-all active:scale-90 inline-flex items-center justify-center shrink-0 cursor-pointer"
      title={label ? `${t("action.copy", "Copiar")} ${label}` : t("action.copy", "Copiar")}
      aria-label={label ? `${t("action.copy", "Copiar")} ${label}` : t("action.copy", "Copiar")}
    >
      {copied ? (
        <CheckIcon
          size={13}
          weight="bold"
          className="text-emerald-500 animate-in zoom-in-75 duration-150"
        />
      ) : (
        <CopyIcon size={12} />
      )}
    </button>
  );
}

export function ConnectDomainModal({
  onConnected,
  initialSlug,
  fixedSlug,
  initialDomain,
  triggerText,
  triggerVariant = "primary",
  triggerClassName,
  triggerIcon,
}: {
  onConnected?: () => void;
  initialSlug?: string;
  fixedSlug?: string;
  initialDomain?: string;
  triggerText?: string;
  triggerVariant?: "primary" | "secondary";
  triggerClassName?: string;
  triggerIcon?: React.ReactNode;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState(initialDomain || "");
  const [selectedSlug, setSelectedSlug] = useState(fixedSlug || initialSlug || "");
  const [scanResult, setScanResult] = useState<DomainDnsScanResult | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("cloudflare");

  const effectiveTriggerText =
    triggerText || (fixedSlug ? t("modal.connectMyDomain", "Conectar mi dominio") : t("modal.connectDomain", "Conectar dominio"));

  const { djs } = usePlatformDjs();
  const { assignDomain, isAssigning, scanDomain, isScanning } =
    usePlatformDomains();

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      if (fixedSlug || initialSlug) {
        setSelectedSlug(fixedSlug || initialSlug || "");
      }
      if (initialDomain && !domain) {
        setDomain(initialDomain);
      }
    }
  };

  const handleScan = async () => {
    if (!domain.trim()) return;
    try {
      const clean = domain
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "");
      setDomain(clean);
      const res = await scanDomain(clean);
      setScanResult(res);
      if (res.provider && res.provider !== "other") {
        setSelectedProvider(res.provider);
      }
    } catch {
      toast.error("No se pudo escanear el dominio. Verifica que sea válido.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlug) {
      toast.error("Selecciona un DJ para asignar el dominio.");
      return;
    }
    if (!domain.trim()) {
      toast.error("Ingresa el dominio a conectar.");
      return;
    }

    try {
      const clean = domain.trim().toLowerCase();
      await assignDomain({
        slug: selectedSlug,
        domain: clean,
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`gigblade_provider_${clean}`, selectedProvider);
      }
      toast.success(`Dominio ${clean} vinculado.`);
      setOpen(false);
      setDomain("");
      setScanResult(null);
      onConnected?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al vincular el dominio.";
      toast.error(message);
    }
  };

  return (
    <>
      <Button
        variant={triggerVariant}
        size="sm"
        onClick={() => {
          if (fixedSlug || initialSlug) {
            setSelectedSlug(fixedSlug || initialSlug || "");
          }
          setOpen(true);
        }}
        className={
          triggerClassName ||
          "gap-1.5 h-8 text-xs font-medium px-3 active:scale-[0.98] transition-all"
        }
      >
        {triggerIcon !== undefined ? (
          triggerIcon
        ) : (
          <PlusIcon size={14} weight="bold" />
        )}
        {effectiveTriggerText}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md p-5 bg-card border border-border text-card-foreground shadow-xl rounded-xl">
          <DialogHeader className="space-y-1 pb-1">
            <div className="flex items-center gap-2">
              <GlobeIcon size={16} className="text-foreground shrink-0" />
              <DialogTitle className="text-sm font-semibold tracking-tight">
                {fixedSlug ? t("modal.connectMyDomain", "Conectar mi dominio") : t("modal.connectDomain", "Conectar dominio")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-tertiary-foreground leading-normal">
              {fixedSlug
                ? t("modal.descFixed", "Configura tu dominio propio en 1 clic para que tu página responda con tu marca.")
                : t("modal.descPlatform", "Configura el enrutamiento para el dominio propio del DJ.")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-1">
            {/* DJ Selector - Only if not locked to fixedSlug */}
            {!fixedSlug ? (
              <div>
                <label
                  htmlFor="dj-select-domain"
                  className="block text-xs font-medium text-foreground mb-1 tracking-tight"
                >
                  {t("modal.assignedDj", "DJ asignado")}
                </label>
                <select
                  id="dj-select-domain"
                  value={selectedSlug}
                  onChange={(e) => setSelectedSlug(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs bg-interactive-secondary/40 border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                  required
                >
                  <option value="">{t("modal.selectDj", "Selecciona un DJ...")}</option>
                  {djs.map((dj) => (
                    <option key={dj.slug} value={dj.slug}>
                      {dj.name} ({dj.slug}) {dj.domain ? `· ${dj.domain}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* Domain input & scan button with rock-solid fixed button width */}
            <div>
              <label
                htmlFor="domain-name-input"
                className="block text-xs font-medium text-foreground mb-1 tracking-tight"
              >
                {t("modal.domain", "Dominio")}
              </label>
              <div className="flex gap-2 items-center">
                <Input
                  id="domain-name-input"
                  placeholder={t("modal.domainPlaceholder", "ej. itshndrxx.com")}
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="font-mono text-xs bg-interactive-secondary/40 border-border h-8 flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleScan}
                  disabled={!domain.trim() || isScanning}
                  className="w-24 shrink-0 h-8 px-0 text-xs font-medium justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <ArrowsClockwiseIcon
                    size={13}
                    className={isScanning ? "animate-spin" : ""}
                  />
                  <span>{isScanning ? t("modal.scanning", "Escaneando") : t("modal.scan", "Escanear")}</span>
                </Button>
              </div>
            </div>

            {/* Registrar selection */}
            <div>
              <label
                htmlFor="registrar-select-input"
                className="block text-xs font-medium text-foreground mb-1 tracking-tight"
              >
                {t("modal.registrarLabel", "Registrador donde compraste el dominio")}
              </label>
              <select
                id="registrar-select-input"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-interactive-secondary/40 border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
              >
                <option value="cloudflare">Cloudflare</option>
                <option value="godaddy">GoDaddy</option>
                <option value="namecom">Name.com</option>
                <option value="namecheap">Namecheap</option>
                <option value="google">Google Domains</option>
                <option value="vercel">Vercel DNS</option>
                <option value="other">Otro / Registrador externo</option>
              </select>
            </div>

            {/* Cloudflare-style Minimalist Provider Card */}
            {scanResult && (
              <div className="border border-border/80 rounded-lg bg-interactive-secondary/20 divide-y divide-border/60 overflow-hidden text-xs animate-in fade-in-50 slide-in-from-top-1 duration-150">
                {/* Header: Platform Logo + Name + Status */}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <ProviderBrandLogo
                      provider={scanResult.provider}
                      nameserverDomain={
                        scanResult.nameservers[0]
                          ? scanResult.nameservers[0]
                              .split(".")
                              .slice(-2)
                              .join(".")
                          : undefined
                      }
                      className="w-4 h-4 shrink-0"
                    />
                    <span className="font-semibold text-foreground text-xs">
                      {scanResult.providerLabel}
                    </span>
                    {scanResult.nameservers.length > 0 && (
                      <span className="text-[11px] text-tertiary-foreground font-mono truncate max-w-[170px]">
                        · {scanResult.nameservers[0]}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-tertiary-foreground shrink-0">
                    {scanResult.pointsToGigBlade
                      ? t("modal.pointsToGigBlade", "Apunta a GigBlades")
                      : t("modal.pending", "Pendiente")}
                  </span>
                </div>

                {/* Specific provider recommendation & compact button */}
                <div className="px-3 py-2 flex items-center justify-between gap-3 bg-interactive-secondary/10">
                  <p className="text-[11px] text-tertiary-foreground leading-relaxed flex-1">
                    {scanResult.provider === "cloudflare" &&
                      t("djDomain.tipCloudflare", "Desactiva el proxy (nube gris / DNS Only) en Cloudflare para validar SSL.")}
                    {scanResult.provider === "godaddy" &&
                      t("djDomain.tipGodaddy", "GoDaddy detectado. Accede a tu Administrador de DNS en GoDaddy para agregar los registros requeridos.")}
                    {scanResult.provider === "namecom" &&
                      t("djDomain.tipNamecom", "Name.com detectado. Ingresa al gestor DNS de Name.com y actualiza estos registros.")}
                    {scanResult.provider === "namecheap" &&
                      t("djDomain.tipNamecheap", "Namecheap detectado. Ve a Advanced DNS en tu panel de Namecheap para guardar estos registros.")}
                    {scanResult.provider === "vercel" &&
                      t("djDomain.tipVercel", "Vercel DNS detectado. Configura estos registros en la sección DNS de tu cuenta.")}
                    {scanResult.provider !== "cloudflare" &&
                      scanResult.provider !== "godaddy" &&
                      scanResult.provider !== "namecom" &&
                      scanResult.provider !== "namecheap" &&
                      scanResult.provider !== "vercel" &&
                      t("djDomain.tipGeneric", "Agrega estos registros en tu registrador de dominios para que tu página responda con GigBlades.")}
                  </p>

                  {scanResult.oneClickUrl && (
                    <a
                      href={scanResult.oneClickUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="h-7 px-2.5 text-xs font-medium rounded-md border border-border bg-card hover:bg-interactive-secondary inline-flex items-center gap-1.5 text-foreground transition-all active:scale-95 shrink-0"
                    >
                      {t("djDomain.openProvider", "Abrir")} {scanResult.providerLabel}
                      <ArrowSquareOutIcon size={12} />
                    </a>
                  )}

                  {!scanResult.oneClickUrl && scanResult.provider === "cloudflare" && (
                    <a
                      href="https://dash.cloudflare.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="h-7 px-2.5 text-xs font-medium rounded-md border border-border bg-card hover:bg-interactive-secondary inline-flex items-center gap-1.5 text-foreground transition-all active:scale-95 shrink-0"
                    >
                      {t("djDomain.openCloudflare", "Abrir Cloudflare")}
                      <ArrowSquareOutIcon size={12} />
                    </a>
                  )}
                </div>

                {/* Clean DNS Records Table */}
                <div className="px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-tertiary-foreground uppercase tracking-wider">
                      {t("domains.dnsRequired", "Registros DNS")}
                    </span>
                    <span className="text-[10px] font-mono text-tertiary-foreground">
                      {t("djDomain.ttlAuto", "TTL: Auto")}
                    </span>
                  </div>

                  <div className="border border-border/70 rounded overflow-x-auto bg-background">
                    <table className="w-full min-w-[260px] text-[11px] text-left">
                      <thead className="bg-interactive-secondary/30 border-b border-border/70 text-[10px] font-mono text-tertiary-foreground">
                        <tr>
                          <th className="px-2 py-1.5 font-medium w-12">{t("djDomain.tableType", "TIPO")}</th>
                          <th className="px-2 py-1.5 font-medium w-24">{t("djDomain.tableName", "NOMBRE / HOST")}</th>
                          <th className="px-2 py-1.5 font-medium">{t("djDomain.tableValue", "VALOR / DESTINO")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50 font-mono">
                        {scanResult.recommendedRecords.map((rec, i) => (
                          <tr
                            key={i}
                            className="hover:bg-interactive-secondary/20 transition-colors"
                          >
                            <td className="px-2 py-1.5 font-semibold text-foreground">
                              {rec.type}
                            </td>
                            <td className="px-2 py-1.5 text-foreground">
                              <div className="flex items-center justify-between gap-1">
                                <span className="break-all">{rec.name}</span>
                                <CopyCellButton value={rec.name} label="Host" />
                              </div>
                            </td>
                            <td className="px-2 py-1.5 text-foreground break-all select-all">
                              <div className="flex items-center justify-between gap-2">
                                <span>{rec.value}</span>
                                <CopyCellButton value={rec.value} label="Valor" />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[10px] text-tertiary-foreground mt-2 leading-relaxed">
                    <strong>Nota:</strong> En el campo <em>Host/Nombre</em> escribe únicamente lo indicado (ej. <code className="bg-interactive-secondary px-1 py-0.5 rounded text-foreground font-mono">dj</code> o <code className="bg-interactive-secondary px-1 py-0.5 rounded text-foreground font-mono">_vercel</code> o <code className="bg-interactive-secondary px-1 py-0.5 rounded text-foreground font-mono">@</code>). Tu registrador añade automáticamente tu dominio.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="mt-1 flex gap-2 justify-end pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-8 px-3 text-xs font-normal"
              >
                {t("modal.cancel", "Cancelar")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isAssigning || !selectedSlug || !domain.trim()}
                className="h-8 px-3.5 text-xs font-medium active:scale-[0.98] transition-all"
              >
                {isAssigning ? t("modal.bindingDomain", "Vinculando...") : t("modal.bindDomain", "Vincular dominio")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
