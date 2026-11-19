"use client";

import type { Icon } from "@phosphor-icons/react";
import {
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  CheckIcon,
  CopyIcon,
  XIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import {
  GIGBLADE_DJS,
  LAST_DJ_STORAGE_KEY,
  djBySlug,
  type DjStatus,
  type GigbladeDj,
} from "@/panel/concept";
import { useLocalStorage } from "@/panel/useLocalStorage";
import { useSession } from "@/panel/auth-client";
import { fetchPublicSite } from "@/panel/site-api";
import { usePlatformDjs } from "@/panel/usePlatformDjs";
import { SlotNumber } from "@/panel/SlotNumber";
import { cn } from "@/panel/cn";
import { useLanguage } from "@/panel/LanguageProvider";

/* -------------------------------------------------------------------------- */
/*  Layout Container & PageHeader (identico a base-main)                      */
/* -------------------------------------------------------------------------- */

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div className={cn("flex flex-1 flex-col gap-6 w-full", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  back,
  badge,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  back?: { href: string; label: string };
  badge?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {back || eyebrow ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-grayscale-9">
            {back ? (
              <Link
                href={back.href}
                className="group inline-flex items-center gap-1 text-grayscale-10 transition-colors duration-150 hover:text-grayscale-12"
              >
                <ArrowLeftIcon
                  size={11}
                  weight="bold"
                  className="transition-transform duration-150 ease-[var(--ease-out-soft)] group-hover:-translate-x-0.5"
                />
                <span>{back.label}</span>
              </Link>
            ) : null}
            {back && eyebrow ? (
              <span aria-hidden className="text-grayscale-6">
                /
              </span>
            ) : null}
            {eyebrow ? <span>{eyebrow}</span> : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="titulo-pagina text-grayscale-12">{title}</h1>
          {badge}
        </div>

        {subtitle ? (
          <p className="max-w-2xl text-[13px] leading-relaxed text-grayscale-10">
            {subtitle}
          </p>
        ) : null}
      </div>

      {children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
          {children}
        </div>
      ) : null}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Buttons & Inputs (identico a base-main/components/public/Button.tsx)      */
/* -------------------------------------------------------------------------- */

export type PanelButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "success";

const BUTTON_VARIANTS: Record<PanelButtonVariant, string> = {
  primary:
    "border border-transparent bg-grayscale-12 text-grayscale-1 shadow-[0_1px_2px_rgba(28,22,16,0.14)] hover:bg-grayscale-11",
  secondary:
    "border border-grayscale-4 bg-grayscale-1 text-grayscale-11 shadow-[0_1px_2px_rgba(28,22,16,0.04)] hover:border-grayscale-5 hover:bg-grayscale-2 hover:text-grayscale-12 dark:border-grayscale-4 dark:bg-grayscale-2 dark:hover:bg-grayscale-3",
  ghost:
    "border border-transparent bg-transparent text-grayscale-10 hover:bg-black/[0.05] hover:text-grayscale-12 dark:hover:bg-white/[0.06]",
  danger:
    "border border-transparent bg-red-9 text-white shadow-[0_1px_2px_rgba(28,22,16,0.14)] hover:bg-red-10",
  success:
    "border border-transparent bg-green-9 text-white shadow-[0_1px_2px_rgba(28,22,16,0.14)] hover:bg-green-10",
};

export function PanelButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: PanelButtonVariant;
  size?: "sm" | "md";
}) {
  return (
    <button
      type={props.type ?? "button"}
      {...props}
      className={cn(
        "inline-flex cursor-pointer select-none items-center justify-center gap-1.5 rounded-md font-medium outline-grayscale-9 transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap",
        size === "sm" ? "h-8 px-3 text-[12px]" : "h-9 px-3.5 text-[12.5px]",
        BUTTON_VARIANTS[variant],
        className,
      )}
    />
  );
}

export const INPUT_CLASS =
  "campo w-full px-3.5 py-2 text-[16px] sm:text-[13px] shadow-[0_1px_2px_rgba(28,22,16,0.03)]";

export function PanelInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(INPUT_CLASS, className)} />;
}

export function PanelTextarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(INPUT_CLASS, "leading-relaxed", className)}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Status Badges (identico a base-main EstadoBadge.tsx — Radix pastel)       */
/* -------------------------------------------------------------------------- */

export type BadgeTone =
  | "amber"
  | "sky"
  | "emerald"
  | "red"
  | "purple"
  | "neutral";

const BADGE_TONES: Record<BadgeTone, { tono: string; dot: string }> = {
  amber: { tono: "bg-amber-3 text-amber-11", dot: "bg-amber-9" },
  sky: { tono: "bg-blue-3 text-blue-11", dot: "bg-blue-9" },
  emerald: { tono: "bg-green-3 text-green-11", dot: "bg-green-9" },
  red: { tono: "bg-red-3 text-red-11", dot: "bg-red-9" },
  purple: { tono: "bg-purple-3 text-purple-11", dot: "bg-purple-9" },
  neutral: { tono: "bg-grayscale-3 text-grayscale-11", dot: "bg-grayscale-9" },
};

export function StatusBadge({
  tone = "neutral",
  children,
  dot = true,
  size = "sm",
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const actual = BADGE_TONES[tone];
  return (
    <span
      className={cn(
        "badge",
        actual.tono,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]",
        className,
      )}
    >
      {dot ? <span className={cn("badge-dot", actual.dot)} /> : null}
      <span className="inline-flex items-center gap-1">{children}</span>
    </span>
  );
}

export function WhatsappIcon({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.156 5.281-1.375c1.469.797 3.109 1.219 4.75 1.219 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.813 14.125c-.25.703-1.438 1.344-2 1.422-.516.078-1.172.109-1.891-.125-.438-.141-1-.328-1.719-.641-3.016-1.297-4.984-4.328-5.141-4.531-.141-.203-1.219-1.625-1.219-3.109s.766-2.203 1.047-2.5c.266-.297.594-.375.797-.375h.578c.188 0 .438-.078.688.516.25.609.859 2.094.938 2.25.078.156.125.344.016.547-.094.203-.156.328-.313.516-.156.172-.328.391-.469.531-.156.156-.313.328-.141.641.188.313.813 1.344 1.75 2.172 1.203 1.078 2.219 1.406 2.531 1.563.313.156.5.125.688-.078.188-.219.797-.938 1.016-1.25.203-.313.422-.266.703-.156.281.109 1.797.844 2.109 1 .313.156.516.234.594.359.078.141.078.797-.172 1.5z" />
    </svg>
  );
}

export function DjStatusCell({ status }: { status: DjStatus }) {
  if (status === "active") {
    return <StatusBadge tone="emerald">Activo</StatusBadge>;
  }
  if (status === "trialing") {
    return <StatusBadge tone="sky">Prueba</StatusBadge>;
  }
  return <StatusBadge tone="amber">Suspendido</StatusBadge>;
}

/* -------------------------------------------------------------------------- */
/*  Segmented Control con pastilla deslizante (identico a base-main)          */
/* -------------------------------------------------------------------------- */

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel = "Filtro",
  className,
}: {
  options: Array<{ value: T; label: string; count?: number; icon?: Icon }>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const botones = useRef(new Map<string, HTMLButtonElement>());
  const [pill, setPill] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  useLayoutEffect(() => {
    const medir = () => {
      const el = botones.current.get(value);
      if (!el) return;
      setPill({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    };

    medir();
    const observador = new ResizeObserver(medir);
    if (contenedor.current) observador.observe(contenedor.current);
    return () => observador.disconnect();
  }, [value, options.length]);

  const hayActivo = options.some((item) => item.value === value);

  return (
    <div
      ref={contenedor}
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "no-scrollbar relative inline-flex w-fit max-w-full flex-nowrap items-center gap-0.5 overflow-x-auto overscroll-x-contain touch-pan-x rounded-lg border border-grayscale-4/70 bg-grayscale-2 p-1 dark:border-white/[0.09] dark:bg-[#161614]",
        className,
      )}
    >
      {pill ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute rounded-md border border-black/[0.06] bg-grayscale-1 shadow-[0_1px_2px_rgba(28,22,16,0.08)] transition-[left,top,width,height,opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] dark:border-white/[0.12] dark:bg-[#252522] dark:shadow-[0_1px_2px_rgba(0,0,0,0.45)]",
            hayActivo ? "scale-100 opacity-100" : "scale-95 opacity-0",
          )}
          style={{
            left: pill.left,
            top: pill.top,
            width: pill.width,
            height: pill.height,
          }}
        />
      ) : null}

      {options.map((option) => {
        const activo = option.value === value;
        const IconComp = option.icon;
        return (
          <button
            key={option.value}
            ref={(el) => {
              if (el) botones.current.set(option.value, el);
              else botones.current.delete(option.value);
            }}
            type="button"
            aria-pressed={activo}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-[color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] sm:px-3 sm:text-[13px]",
              activo
                ? "text-grayscale-12"
                : "text-grayscale-10 hover:text-grayscale-12",
            )}
          >
            {IconComp ? (
              <IconComp
                size={14}
                weight={activo ? "fill" : "regular"}
                className={cn(
                  "shrink-0 transition-colors duration-150",
                  activo ? "text-grayscale-11" : "text-grayscale-9",
                )}
              />
            ) : null}
            <span>{option.label}</span>
            {typeof option.count === "number" ? (
              <SlotNumber
                value={option.count}
                duration={260}
                className={cn(
                  "text-[11px] font-medium transition-colors duration-150",
                  activo ? "text-grayscale-10" : "text-grayscale-9",
                )}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  MetricCard (identico a base-main/components/ui/MetricCard.tsx)            */
/* -------------------------------------------------------------------------- */

type MetricTone = "neutral" | "amber" | "blue" | "emerald" | "red" | "purple";

const METRIC_TONES: Record<
  MetricTone,
  { dot: string; barra: string; spark: string }
> = {
  neutral: {
    dot: "bg-grayscale-9",
    barra: "bg-grayscale-9",
    spark: "bg-grayscale-9",
  },
  amber: { dot: "bg-amber-9", barra: "bg-amber-9", spark: "bg-amber-9" },
  blue: { dot: "bg-blue-9", barra: "bg-blue-9", spark: "bg-blue-9" },
  emerald: { dot: "bg-green-9", barra: "bg-green-9", spark: "bg-green-9" },
  red: { dot: "bg-red-9", barra: "bg-red-9", spark: "bg-red-9" },
  purple: { dot: "bg-purple-9", barra: "bg-purple-9", spark: "bg-purple-9" },
};

const TICKS_IDS = [
  "t0",
  "t1",
  "t2",
  "t3",
  "t4",
  "t5",
  "t6",
  "t7",
  "t8",
  "t9",
] as const;
const SPARK_BARS = [
  { id: "s0", alto: 11 },
  { id: "s1", alto: 20 },
  { id: "s2", alto: 14 },
  { id: "s3", alto: 28 },
  { id: "s4", alto: 17 },
  { id: "s5", alto: 23 },
] as const;

export function MetricCard({
  label,
  value,
  suffix,
  footer,
  tone = "neutral",
  ratio = 0.72,
  icon: IconComponent,
  period = "Período",
  valueClassName,
  delay = 0,
  className,
}: {
  label: string;
  value: ReactNode;
  suffix?: string;
  footer?: ReactNode;
  tone?: MetricTone;
  ratio?: number;
  icon?: Icon;
  period?: string;
  valueClassName?: string;
  delay?: number;
  className?: string;
}) {
  const safeRatio = Math.max(0, Math.min(1, ratio));
  const palette = METRIC_TONES[tone];
  const sparkCount = Math.min(
    SPARK_BARS.length,
    Math.max(safeRatio > 0 ? 1 : 0, Math.round(safeRatio * SPARK_BARS.length)),
  );
  const tickCount = Math.min(
    TICKS_IDS.length,
    Math.max(safeRatio > 0 ? 1 : 0, Math.round(safeRatio * TICKS_IDS.length)),
  );

  return (
    <div
      className={cn(
        "card-shell card-shell-hover flex min-w-0 flex-col",
        className,
      )}
      style={{ "--stagger": delay } as CSSProperties}
    >
      <div className="card-panel flex min-w-0 flex-1 flex-col justify-between px-4 py-3.5">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <div
              aria-hidden
              skullet-ignore=""
              className={cn("size-1.5 shrink-0 rounded-full", palette.dot)}
            />
            <span className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-grayscale-9">
              {label}
            </span>
          </div>

          {IconComponent ? (
            <span
              skullet-block=""
              className="flex size-6.5 shrink-0 items-center justify-center rounded-full border border-grayscale-3/90 bg-grayscale-1 text-grayscale-10 shadow-2xs dark:border-grayscale-4/70 dark:bg-grayscale-3"
            >
              <IconComponent size={12} weight="bold" />
            </span>
          ) : null}
        </div>

        <div className="mt-2.5 flex min-w-0 flex-col gap-2.5">
          <div className="flex min-w-0 items-end justify-between gap-2">
            <div className="flex min-w-0 items-baseline gap-1.5">
              <div
                className={cn(
                  "font-mono text-[26px] font-bold leading-none tracking-tight text-grayscale-12 tabular-nums",
                  valueClassName,
                )}
              >
                {typeof value === "number" ? (
                  <SlotNumber value={value} />
                ) : (
                  value
                )}
              </div>
              {suffix ? (
                <span className="truncate text-[11.5px] font-medium text-grayscale-9">
                  {suffix}
                </span>
              ) : null}
            </div>

            <div
              aria-hidden
              skullet-block=""
              className="flex h-7 shrink-0 items-end gap-[3.5px]"
            >
              {SPARK_BARS.map((barra, i) => (
                <div
                  key={barra.id}
                  className={cn(
                    "w-[2px] rounded-full transition-colors duration-200",
                    i < sparkCount
                      ? palette.spark
                      : "bg-grayscale-3 dark:bg-grayscale-4/60",
                  )}
                  style={{ height: barra.alto }}
                />
              ))}
            </div>
          </div>

          <div
            aria-hidden
            skullet-block=""
            className="flex w-full min-w-0 items-center gap-[4px]"
          >
            {TICKS_IDS.map((tickId, i) => (
              <div
                key={tickId}
                className={cn(
                  "h-[3.5px] min-w-0 flex-1 rounded-full transition-colors duration-200",
                  i < tickCount
                    ? palette.barra
                    : "bg-grayscale-3/60 dark:bg-grayscale-4/30",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-between gap-2 px-3.5 py-2 text-[11px] text-grayscale-10">
        <div className="flex min-w-0 items-center gap-1.5 truncate font-medium">
          {footer ?? <span>Actualizado</span>}
        </div>
        <span className="shrink-0 font-mono text-[10px] text-grayscale-8 dark:text-grayscale-9">
          {period}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  DistributionBar (en card-shell dual-tone de base-main)                    */
/* -------------------------------------------------------------------------- */

export function DistributionBar({
  title,
  subtitle,
  segments,
}: {
  title: string;
  subtitle?: string;
  segments: Array<{
    key: string;
    label: string;
    count: number;
    percent: number;
    barClass: string;
    cardClass: string;
    labelClass: string;
    valueClass: string;
  }>;
}) {
  return (
    <div className="card-shell">
      <div className="card-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[13.5px] font-semibold text-grayscale-12">
            {title}
          </h2>
          {subtitle ? (
            <span className="font-mono text-[11px] text-grayscale-9">
              {subtitle}
            </span>
          ) : null}
        </div>

        <div className="flex h-3 w-full gap-1 overflow-hidden rounded-full bg-grayscale-3/70 p-0.5 dark:bg-white/[0.06]">
          {segments.map((seg) =>
            seg.percent > 0 ? (
              <div
                key={seg.key}
                style={{ width: `${seg.percent}%` }}
                className={cn("rounded-full transition-all", seg.barClass)}
                title={`${seg.label}: ${seg.count}`}
              />
            ) : null,
          )}
        </div>

        <div
          className={cn(
            "grid grid-cols-1 gap-2.5 text-[12px]",
            segments.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3",
          )}
        >
          {segments.map((seg) => (
            <div
              key={seg.key}
              className="surface-soft flex items-center justify-between px-3.5 py-2.5"
            >
              <span className="font-medium text-grayscale-11">{seg.label}</span>
              <span className="font-mono font-semibold text-grayscale-12 tabular-nums">
                {seg.count} ({Math.round(seg.percent)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Modal / Dialog (card-shell + menu-pop)                                    */
/* -------------------------------------------------------------------------- */

export function PanelModal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidthClass = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "menu-pop w-full max-h-[90dvh] overflow-y-auto rounded-xl border border-grayscale-4 bg-grayscale-1 text-grayscale-12 shadow-[0_8px_24px_-8px_rgba(28,22,16,0.16)] dark:border-white/[0.12] dark:bg-[#1b1b1a] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.55)]",
          maxWidthClass,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-grayscale-3/80 pb-4 dark:border-white/[0.08]">
            <div>
              <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-grayscale-12">
                {title}
              </h2>
              {description ? (
                <p className="mt-1 text-[12.5px] leading-relaxed text-grayscale-10">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-grayscale-9 transition-colors hover:bg-grayscale-2 hover:text-grayscale-12"
            >
              <XIcon size={15} weight="bold" />
            </button>
          </div>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/*  CopyButton & EmptyState (identico a base-main)                            */
/* -------------------------------------------------------------------------- */

export function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-grayscale-4 bg-grayscale-1 px-2.5 py-1 text-[11px] font-medium text-grayscale-11 transition-colors hover:border-grayscale-5 hover:bg-grayscale-2 hover:text-grayscale-12 dark:bg-grayscale-2 dark:hover:bg-grayscale-3",
        className,
      )}
      title="Copiar"
    >
      {copied ? (
        <CheckIcon size={12} weight="bold" className="text-green-10" />
      ) : (
        <CopyIcon size={12} className="text-grayscale-9" />
      )}
      {label ? <span>{copied ? "Copiado" : label}</span> : null}
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl border border-grayscale-3 bg-grayscale-2 text-grayscale-9">
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-grayscale-12">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-grayscale-10">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  GigBlades Shared Controls (OpenPublicPageButton, DjSelect, useSelectedDj) */
/* -------------------------------------------------------------------------- */

export function OpenPublicPageButton({
  href,
  label,
  className,
}: {
  href: string | null;
  label?: string;
  className?: string;
}) {
  const { t } = useLanguage();
  const displayLabel = label ?? t("action.openPage", "Abrir página");

  if (!href) {
    return (
      <PanelButton variant="secondary" size="sm" disabled className={className}>
        <ArrowSquareOutIcon size={13} />
        <span>{displayLabel}</span>
      </PanelButton>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-grayscale-4 bg-grayscale-1 px-3 text-[12px] font-medium text-grayscale-11 shadow-[0_1px_2px_rgba(28,22,16,0.04)] transition-all hover:border-grayscale-5 hover:bg-grayscale-2 hover:text-grayscale-12 dark:bg-grayscale-2 dark:hover:bg-grayscale-3 whitespace-nowrap",
        className,
      )}
    >
      <ArrowSquareOutIcon size={13} />
      <span>{displayLabel}</span>
    </a>
  );
}

function djFromAccount(
  user: { slug?: string; name?: string; email?: string },
  domain?: string,
): GigbladeDj | null {
  if (!user.slug) return null;
  const seed = GIGBLADE_DJS.find((dj) => dj.slug === user.slug);
  return {
    slug: user.slug,
    name: user.name || seed?.name || user.slug,
    email: user.email || seed?.email || "",
    domain: domain || seed?.domain || "",
    city: seed?.city ?? "",
    template: seed?.template ?? "after",
    status: "active",
    bio: seed?.bio ?? "",
    instagram: seed?.instagram ?? "",
    createdAt: seed?.createdAt ?? Date.now(),
  };
}

export function useSelectedDj() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [lastSlug, setLastSlug] = useLocalStorage(LAST_DJ_STORAGE_KEY, "");
  const { data: session, isPending: sessionPending } = useSession();
  const user = session?.user as
    | { role?: string; slug?: string; name?: string; email?: string }
    | undefined;
  const { djs, status: sitesStatus } = usePlatformDjs();
  const lockedSlug = user?.role === "dj" ? user.slug : undefined;

  const ownSite = useQuery({
    queryKey: ["panel", "own-site", lockedSlug],
    queryFn: () => fetchPublicSite(lockedSlug ?? ""),
    enabled: Boolean(lockedSlug),
    staleTime: 15_000,
    retry: false,
  });

  const paramDj = searchParams.get("dj");
  const requested = lockedSlug || paramDj || lastSlug || "";
  const liveDj =
    user?.role === "platform" && sitesStatus === "ready"
      ? (djs.find((item) => item.slug === requested) ?? djs[0])
      : undefined;
  const accountDj = lockedSlug
    ? djFromAccount(user ?? {}, ownSite.data?.domain)
    : null;
  const ownSiteReady =
    !sessionPending && (!lockedSlug || ownSite.isSuccess || ownSite.isError);
  const dj = liveDj ?? accountDj ?? djBySlug(requested || "marco");
  const visitsReady = Boolean(liveDj || accountDj);
  const sitesReady = visitsReady || sitesStatus === "error";

  useEffect(() => {
    if (!visitsReady || lastSlug === dj.slug) return;
    setLastSlug(dj.slug);
  }, [visitsReady, dj.slug, lastSlug, setLastSlug]);

  useEffect(() => {
    if (!visitsReady || paramDj === dj.slug) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("dj", dj.slug);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [visitsReady, dj.slug, paramDj, pathname, router, searchParams]);

  const setDj = (slug: string) => {
    if (slug === dj.slug && paramDj === slug) return;
    setLastSlug(slug);
    const next = new URLSearchParams(searchParams.toString());
    next.set("dj", slug);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return { dj, setDj, sitesReady, visitsReady, ownSiteReady };
}

export function DjSelect({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (slug: string) => void;
}) {
  const { data: session } = useSession();
  const { djs } = usePlatformDjs();
  if ((session?.user as { role?: string } | undefined)?.role === "dj") {
    return null;
  }

  return (
    <select
      aria-label="Elegí un DJ"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      className="campo h-8 min-w-[130px] max-w-full sm:max-w-[200px] cursor-pointer truncate px-2.5 text-[16px] sm:text-[12px] font-medium"
    >
      {djs.map((dj) => (
        <option key={dj.slug} value={dj.slug}>
          {dj.name}
        </option>
      ))}
    </select>
  );
}
