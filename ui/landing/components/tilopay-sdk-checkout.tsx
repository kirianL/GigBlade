"use client";

import {
	CheckIcon,
	CopyIcon,
	EyeIcon,
	EyeSlashIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { slotText, type SlotTextController } from "slot-text";
import {
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
	type Ref,
} from "react";
import {
	splitCardholderName,
	type TilopayBillingDefaults,
	type TilopayCurrency,
} from "@/domain/tilopay";

const TILOPAY_SDK_URL = "https://app.tilopay.com/sdk/v2/sdk_tpay.min.js";

export type TilopayCheckoutSession = {
	sdkToken: string;
	orderNumber: string;
	amount: number;
	currency: TilopayCurrency;
	amountFormatted: string;
	redirectUrl: string;
	webhookUrl: string;
	billingDefaults: TilopayBillingDefaults;
};

export type TilopayCheckoutHandle = {
	submitPayment: () => Promise<void>;
};

type TilopayMethod = {
	id: string;
	name: string;
	type?: string;
};

type TilopaySavedCard = {
	id?: string | number;
	token?: string;
	last4?: string;
	last?: string;
	card?: string;
	brand?: string;
};

type TilopayInitResult = {
	message?: string;
	environment?: string;
	methods?: TilopayMethod[];
	cards?: TilopaySavedCard[];
	sinpemovil?: {
		code?: string | number;
		amount?: string | number;
	};
};

type TilopayWindow = Window & {
	Tilopay?: {
		Init: (options: Record<string, unknown>) => Promise<TilopayInitResult>;
		startPayment: () => Promise<{ message?: string } | undefined>;
		updateOptions: (options: Record<string, unknown>) => Promise<unknown>;
		getCardType?: () => Promise<{ message?: string }>;
		getSinpeMovil?: () => Promise<{
			message?: string;
			code?: string | number;
			amount?: string | number;
			number?: string | number;
		}>;
	};
};

let sdkScriptPromise: Promise<void> | null = null;

function loadTilopaySdk(): Promise<void> {
	if (typeof window === "undefined") {
		return Promise.reject(new Error("Solo disponible en el navegador"));
	}
	if ((window as TilopayWindow).Tilopay) {
		return Promise.resolve();
	}
	if (sdkScriptPromise) {
		return sdkScriptPromise;
	}

	sdkScriptPromise = new Promise<void>((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>(
			`script[src="${TILOPAY_SDK_URL}"]`,
		);
		if (existing) {
			if ((window as TilopayWindow).Tilopay) {
				resolve();
				return;
			}
			existing.addEventListener("load", () => resolve(), { once: true });
			existing.addEventListener(
				"error",
				() => {
					sdkScriptPromise = null;
					reject(new Error("No pudimos cargar la pasarela Tilopay."));
				},
				{ once: true },
			);
			return;
		}

		const script = document.createElement("script");
		script.src = TILOPAY_SDK_URL;
		script.async = true;
		script.onload = () => {
			if ((window as TilopayWindow).Tilopay) {
				resolve();
			} else {
				sdkScriptPromise = null;
				reject(new Error("Tilopay SDK no se inicializó en la página."));
			}
		};
		script.onerror = () => {
			sdkScriptPromise = null;
			reject(new Error("No pudimos conectar con Tilopay."));
		};
		document.head.appendChild(script);
	});

	return sdkScriptPromise;
}

function detectCardBrandLabel(
	rawNumber: string,
): "VISA" | "MASTERCARD" | "AMEX" | "" {
	const digits = rawNumber.replace(/\D/g, "");
	if (!digits) return "";
	if (digits.startsWith("4")) return "VISA";
	if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(digits)) {
		return "MASTERCARD";
	}
	if (/^3[47]/.test(digits)) return "AMEX";
	return "";
}

function methodProcessorType(methodId: string): string {
	return methodId.split(":")[1] ?? "";
}

export function artistInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length >= 2) {
		return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
	}
	return (parts[0]?.slice(0, 2) || "DJ").toUpperCase();
}

export function GigBladesMark() {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M12 2.5L20.5 7.5V16.5L12 21.5L3.5 16.5V7.5L12 2.5Z"
				fill="#1F2937"
			/>
			<path
				d="M12 2.5L20.5 7.5L12 12.2L3.5 7.5L12 2.5Z"
				fill="#6B7280"
			/>
			<path
				d="M12 12.2L20.5 7.5V16.5L12 21.5V12.2Z"
				fill="#374151"
			/>
		</svg>
	);
}

function formatSummaryDate(iso: string): string {
	if (!iso) return "Por elegir";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "Por elegir";
	const formatted = new Intl.DateTimeFormat("es-CR", {
		weekday: "short",
		day: "numeric",
		month: "short",
		timeZone: "America/Costa_Rica",
	})
		.format(date)
		.replace(/\./g, "");
	return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatSummaryTime(iso: string): string {
	if (!iso) return "Por elegir";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "Por elegir";
	return new Intl.DateTimeFormat("es-CR", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
		timeZone: "America/Costa_Rica",
	}).format(date);
}

function EmvChipSvg() {
	return (
		<svg width="36" height="27" viewBox="0 0 36 27" fill="none" aria-hidden="true">
			<defs>
				<linearGradient id="gb-silver-chip" x1="0" y1="0" x2="36" y2="27" gradientUnits="userSpaceOnUse">
					<stop offset="0%" stopColor="#F3F4F6" />
					<stop offset="50%" stopColor="#D1D5DB" />
					<stop offset="100%" stopColor="#9CA3AF" />
				</linearGradient>
			</defs>
			<rect
				x="0.5"
				y="0.5"
				width="35"
				height="26"
				rx="5"
				fill="url(#gb-silver-chip)"
				stroke="rgba(0,0,0,0.22)"
			/>
			<path
				d="M12 0.5V26.5M24 0.5V26.5M0.5 9.5H12M24 9.5H35.5M0.5 17.5H12M24 17.5H35.5M12 13.5H24"
				stroke="rgba(0,0,0,0.25)"
				strokeWidth="1"
			/>
		</svg>
	);
}

function ContactlessSvg() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-white/85">
			<path d="M8.5 15.5C9.8 13.6 9.8 10.4 8.5 8.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
			<path d="M12 17.5C14 14.3 14 9.7 12 6.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
			<path d="M15.5 19.5C18.2 15 18.2 9 15.5 4.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
		</svg>
	);
}

function formatExpiryDisplay(raw: string): string {
	const clean = raw.replace(/\s+/g, "");
	if (!clean) return "MM/AA";
	const digits = clean.replace(/\D/g, "");
	if (digits.length >= 6) {
		// Handles MM/YYYY autofill like 09/2027 -> 09/27
		return `${digits.slice(0, 2)}/${digits.slice(-2)}`;
	}
	if (digits.length >= 3) {
		return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
	}
	return clean;
}

function VisaLogo({ className = "" }: { className?: string }) {
	return (
		<svg
			width="46"
			height="15"
			viewBox="0 0 1000 324.68"
			fill="none"
			aria-label="Visa"
			className={className}
		>
			<path
				fill="currentColor"
				d="m651.19.5c-70.93,0-134.32,36.77-134.32,104.69,0,77.9,112.42,83.28,112.42,122.42,0,16.48-18.88,31.23-51.14,31.23-45.77,0-79.98-20.61-79.98-20.61l-14.64,68.55s39.41,17.41,91.73,17.41c77.55,0,138.58-38.57,138.58-107.66,0-82.32-112.89-87.54-112.89-123.86,0-12.91,15.5-27.05,47.66-27.05,36.29,0,65.89,14.99,65.89,14.99l14.33-66.2S696.61.5,651.18.5h0ZM2.22,5.5L.5,15.49s29.84,5.46,56.72,16.36c34.61,12.49,37.07,19.77,42.9,42.35l63.51,244.83h85.14L379.93,5.5h-84.94l-84.28,213.17-34.39-180.7c-3.15-20.68-19.13-32.48-38.68-32.48,0,0-135.41,0-135.41,0Zm411.87,0l-66.63,313.53h81L494.85,5.5h-80.76Zm451.76,0c-19.53,0-29.88,10.46-37.47,28.73l-118.67,284.8h84.94l16.43-47.47h103.48l9.99,47.47h74.95L934.12,5.5h-68.27Zm11.05,84.71l25.18,117.65h-67.45l42.28-117.65h0Z"
			/>
		</svg>
	);
}

function MastercardLogo({ className = "" }: { className?: string }) {
	return (
		<svg
			width="32"
			height="20"
			viewBox="0 0 999.2 618"
			fill="none"
			aria-label="Mastercard"
			className={className}
		>
			<rect x="364" y="66.1" fill="#FF5A00" width="270.4" height="485.8" />
			<path
				fill="#EB001B"
				d="M382,309c0-98.7,46.4-186.3,117.6-242.9C447.2,24.9,381.1,0,309,0C138.2,0,0,138.2,0,309s138.2,309,309,309c72.1,0,138.2-24.9,190.6-66.1C428.3,496.1,382,407.7,382,309z"
			/>
			<path
				fill="#F79E1B"
				d="M999.2,309c0,170.8-138.2,309-309,309c-72.1,0-138.2-24.9-190.6-66.1c72.1-56.7,117.6-144.2,117.6-242.9S570.8,122.7,499.6,66.1C551.9,24.9,618,0,690.1,0C861,0,999.2,139.1,999.2,309z"
			/>
		</svg>
	);
}

function AmexLogo({ className = "" }: { className?: string }) {
	return (
		<svg
			width="22"
			height="22"
			viewBox="0 0 1000 997.52"
			fill="none"
			aria-label="American Express"
			className={`rounded-[3px] ${className}`}
		>
			<g transform="translate(-55.5,-1002.3452)">
				<path
					d="m 55.5,1002.3454 997.5168,0 0,538.4893 -49.3744,77.1475 49.3744,68.6613 0,313.2187 -997.5168,0 0,-507.6304 L 86.358989,1456.744 55.5,1422.7991 Z"
					fill="#016fd0"
				/>
				<path
					d="m 249.14015,1697.4441 0,-156.6094 165.82027,0 17.79072,23.1924 18.37901,-23.1924 601.88665,0 0,145.8088 c 0,0 -15.7404,10.644 -33.9449,10.8006 l -333.27706,0 -20.05834,-24.6872 0,24.6872 -65.72965,0 0,-42.1418 c 0,0 -8.97877,5.8825 -28.39026,5.8825 l -22.37277,0 0,36.2593 -99.52024,0 -17.7653,-23.6898 -18.03807,23.6898 z"
					fill="#ffffff"
				/>
				<path
					d="m 55.5,1422.7991 37.393125,-87.1766 64.667505,0 21.22103,48.8328 0,-48.8328 80.38767,0 12.63289,35.2949 12.24716,-35.2949 360.8573,0 0,17.7439 c 0,0 18.96995,-17.7439 50.14586,-17.7439 l 117.08499,0.4092 20.85469,48.1937 0,-48.6029 67.27259,0 18.5154,27.6834 0,-27.6834 67.88977,0 0,156.6093 -67.88977,0 -17.74392,-27.7731 0,27.7731 -98.83835,0 -9.93959,-24.6872 -26.57108,0 -9.77781,24.6872 -67.02872,0 c -26.82589,0 -43.97406,-17.3816 -43.97406,-17.3816 l 0,17.3816 -101.06318,0 -20.05835,-24.6872 0,24.6872 -375.80462,0 -9.93274,-24.6872 -26.48635,0 -9.86254,24.6872 -46.1989,0 z"
					fill="#ffffff"
				/>
				<path d="m 106.12803,1354.9291 -50.435161,117.2641 32.835892,0 9.305914,-23.4816 54.099665,0 9.2577,23.4816 33.55915,0 -50.38695,-117.2641 -38.23621,0 z m 18.66004,27.2909 16.49028,41.0329 -33.02877,0 16.53849,-41.0329 z" fill="#016fd0" />
				<path d="m 198.22282,1472.1735 0,-117.2642 46.66163,0.1733 27.13999,75.6045 26.4901,-75.7778 46.28848,0 0,117.2642 -29.31604,0 0,-86.4052 -31.07562,86.4052 -25.71023,0 -31.16227,-86.4052 0,86.4052 z" fill="#016fd0" />
				<path d="m 364.86136,1472.1735 0,-117.2642 95.66287,0 0,26.2302 -66.03824,0 0,20.0583 64.49529,0 0,24.6872 -64.49529,0 0,20.8298 66.03824,0 0,25.4587 z" fill="#016fd0" />
				<path d="m 477.49667,1354.9291 0,117.2641 29.31604,0 0,-41.6596 12.34359,0 35.15032,41.6596 35.82536,0 -38.57374,-43.2025 c 15.8309,-1.3359 32.16085,-14.9233 32.16085,-36.0182 0,-24.6765 -19.36827,-38.0434 -40.98459,-38.0434 l -65.23783,0 z m 29.31604,26.2301 33.51093,0 c 8.03881,0 13.88655,6.2882 13.88655,12.3436 0,7.7905 -7.57673,12.3436 -13.45259,12.3436 l -33.94489,0 0,-24.6872 z" fill="#016fd0" />
				<path d="m 625.61982,1472.1735 -29.93322,0 0,-117.2642 29.93322,0 z" fill="#016fd0" />
				<path d="m 696.59549,1472.1735 -6.4611,0 c -31.26172,0 -50.24229,-24.6292 -50.24229,-58.1499 0,-34.3488 18.76806,-59.1143 58.24634,-59.1143 l 32.40194,0 0,27.7731 -33.58657,0 c -16.026,0 -27.35994,12.5067 -27.35994,31.6305 0,22.7096 12.95987,32.2476 31.63047,32.2476 l 7.71474,0 z" fill="#016fd0" />
				<path d="m 760.3868,1354.9291 -50.43515,117.2641 32.83589,0 9.30591,-23.4816 54.09967,0 9.25769,23.4816 33.55915,0 -50.38694,-117.2641 -38.23622,0 z m 18.66005,27.2909 16.49027,41.0329 -33.02876,0 16.53849,-41.0329 z" fill="#016fd0" />
				<path d="m 852.43338,1472.1735 0,-117.2642 37.27187,0 47.59035,73.6759 0,-73.6759 29.31604,0 0,117.2642 -36.06644,0 -48.79578,-75.6045 0,75.6045 z" fill="#016fd0" />
				<path d="m 269.1985,1677.3858 0,-117.2642 95.66286,0 0,26.2302 -66.03823,0 0,20.0583 64.49528,0 0,24.6872 -64.49528,0 0,20.8298 66.03823,0 0,25.4587 z" fill="#016fd0" />
				<path d="m 737.94653,1677.3858 0,-117.2642 95.66287,0 0,26.2302 -66.03824,0 0,20.0583 64.1867,0 0,24.6872 -64.1867,0 0,20.8298 66.03824,0 0,25.4587 z" fill="#016fd0" />
				<path d="m 368.57408,1677.3858 46.57779,-57.9089 -47.68678,-59.3553 36.93435,0 28.39991,36.6932 28.49635,-36.6932 35.48784,0 -47.05996,58.6321 46.66353,58.6321 -36.92851,0 -27.57537,-36.1148 -26.90518,36.1148 z" fill="#016fd0" />
				<path d="m 499.86944,1560.1414 0,117.2641 30.08751,0 0,-37.0308 30.85899,0 c 26.11107,0 45.90274,-13.8524 45.90274,-40.7917 0,-22.3164 -15.52271,-39.4416 -42.09358,-39.4416 l -64.75566,0 z m 30.08751,26.5194 32.49837,0 c 8.43546,0 14.46515,5.1701 14.46515,13.5008 0,7.8262 -5.99925,13.5008 -14.56158,13.5008 l -32.40194,0 0,-27.0016 z" fill="#016fd0" />
				<path d="m 619.44802,1560.1216 0,117.2642 29.31604,0 0,-41.6597 12.34359,0 35.15032,41.6597 35.82536,0 -38.57374,-43.2026 c 15.83089,-1.3361 32.16085,-14.9233 32.16085,-36.0183 0,-24.6764 -19.36827,-38.0433 -40.98459,-38.0433 l -65.23783,0 z m 29.31604,26.2302 33.51093,0 c 8.03881,0 13.88654,6.2881 13.88654,12.3435 0,7.7906 -7.57673,12.3436 -13.45259,12.3436 l -33.94488,0 0,-24.6871 z" fill="#016fd0" />
				<path d="m 847.18735,1677.3858 0,-25.4587 58.67066,0 c 8.68115,0 12.44003,-4.6912 12.44003,-9.8363 0,-4.9296 -3.74703,-9.9134 -12.44003,-9.9134 l -26.5126,0 c -23.04571,0 -35.88042,-14.0409 -35.88042,-35.1214 0,-18.8023 11.75348,-36.9344 45.99918,-36.9344 l 57.08913,0 -12.3436,26.3844 -49.37438,0 c -9.43821,0 -12.3436,4.9526 -12.3436,9.6821 0,4.8612 3.59036,10.222 10.80065,10.222 l 27.77309,0 c 25.69029,0 36.83792,14.5724 36.83792,33.6556 0,20.5163 -12.42212,37.3201 -38.23646,37.3201 z" fill="#016fd0" />
				<path d="m 954.78398,1677.3858 0,-25.4587 58.67062,0 c 8.6812,0 12.4401,-4.6912 12.4401,-9.8363 0,-4.9296 -3.7471,-9.9134 -12.4401,-9.9134 l -26.51256,0 c -23.04571,0 -35.88043,-14.0409 -35.88043,-35.1214 0,-18.8023 11.75348,-36.9344 45.99918,-36.9344 l 57.08911,0 -12.3436,26.3844 -49.37436,0 c -9.4382,0 -12.34359,4.9526 -12.34359,9.6821 0,4.8612 3.59035,10.222 10.80064,10.222 l 27.77311,0 c 25.6903,0 36.8379,14.5724 36.8379,33.6556 0,20.5163 -12.4221,37.3201 -38.2365,37.3201 z" fill="#016fd0" />
			</g>
		</svg>
	);
}

function formatCardDisplay(raw: string, brand: "VISA" | "MASTERCARD" | "AMEX" | ""): string {
	const digits = raw.replace(/\D/g, "").slice(0, brand === "AMEX" ? 15 : 16);
	if (brand === "AMEX") {
		const padded = digits.padEnd(15, "•");
		return `${padded.slice(0, 4)}  ${padded.slice(4, 10)}  ${padded.slice(10, 15)}`;
	}
	const padded = digits.padEnd(16, "•");
	return `${padded.slice(0, 4)}  ${padded.slice(4, 8)}  ${padded.slice(8, 12)}  ${padded.slice(12, 16)}`;
}

function CardSlotValue({
	value,
	className = "",
}: {
	value: string;
	className?: string;
}) {
	const ref = useRef<HTMLSpanElement>(null);
	const controlRef = useRef<SlotTextController | null>(null);
	const initialRef = useRef(value);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		controlRef.current = slotText(el, initialRef.current, {
			rollBy: "character",
			duration: 480,
			stagger: 34,
			bounce: 0,
			skipUnchanged: true,
		});
		return () => {
			controlRef.current?.destroy();
			controlRef.current = null;
		};
	}, []);

	useEffect(() => {
		controlRef.current?.set(value, {
			duration: 480,
			stagger: 34,
			bounce: 0,
			skipUnchanged: true,
		});
	}, [value]);

	return (
		<span ref={ref} className={`inline-flex whitespace-pre ${className}`}>
			{value}
		</span>
	);
}

function CardBrandMark({
	brand,
	onCard = false,
}: {
	brand: "VISA" | "MASTERCARD" | "AMEX" | "";
	onCard?: boolean;
}) {
	if (brand === "VISA") {
		return (
			<VisaLogo
				className={`shrink-0 ${
					onCard ? "text-white" : "text-[#1A1F71] dark:text-[#93B4FF]"
				}`}
			/>
		);
	}
	if (brand === "AMEX") {
		return <AmexLogo className="shrink-0" />;
	}
	if (brand === "MASTERCARD") {
		return (
			<span
				className={
					onCard
						? "inline-flex shrink-0 rounded-full p-0.5 ring-1 ring-white/80"
						: "inline-flex shrink-0"
				}
			>
				<MastercardLogo />
			</span>
		);
	}
	return null;
}

export function TilopaySdkCheckout({
	ref,
	session,
	artistName,
	error,
	onCancel,
	onBeforeRedirect,
	onReadyChange,
	onPayingChange,
	onEnvironmentChange,
	onError,
}: {
	ref?: Ref<TilopayCheckoutHandle>;
	session: TilopayCheckoutSession;
	artistName: string;
	error: string | null;
	onCancel: () => void;
	onBeforeRedirect: () => void;
	onReadyChange?: (ready: boolean) => void;
	onPayingChange?: (paying: boolean) => void;
	onEnvironmentChange?: (env: "TEST" | "PROD") => void;
	onError: (message: string | null) => void;
}) {
	const [ready, setReady] = useState(false);
	const [paying, setPaying] = useState(false);
	const [methods, setMethods] = useState<TilopayMethod[]>([]);
	const [selectedMethodId, setSelectedMethodId] = useState("");
	const [cardBrand, setCardBrand] = useState<"VISA" | "MASTERCARD" | "AMEX" | "">("");
	const [cardNumberPreview, setCardNumberPreview] = useState("");
	const [holderPreview, setHolderPreview] = useState("");
	const [expiryPreview, setExpiryPreview] = useState("");
	const [activeField, setActiveField] = useState<"number" | "name" | "expiry" | "cvv" | null>(null);
	const [showCvv, setShowCvv] = useState(false);
	const [sinpeDetails, setSinpeDetails] = useState<{
		number: string;
		amount: string;
		code: string;
	} | null>(null);
	const [copiedKey, setCopiedKey] = useState<"number" | "code" | null>(null);

	const holderRef = useRef<HTMLInputElement>(null);
	const ccRef = useRef<HTMLInputElement>(null);
	const expRef = useRef<HTMLInputElement>(null);
	const cvvRef = useRef<HTMLInputElement>(null);
	const paymentMethodInputRef = useRef<HTMLInputElement>(null);
	const savedCardsInputRef = useRef<HTMLInputElement>(null);
	const responseContainerRef = useRef<HTMLDivElement>(null);
	const onReadyRef = useRef(onReadyChange);
	const onPayingRef = useRef(onPayingChange);
	const onEnvRef = useRef(onEnvironmentChange);
	const onErrorRef = useRef(onError);
	onReadyRef.current = onReadyChange;
	onPayingRef.current = onPayingChange;
	onEnvRef.current = onEnvironmentChange;
	onErrorRef.current = onError;

	const selectMethod = useCallback((methodId: string) => {
		setSelectedMethodId(methodId);
		const input = paymentMethodInputRef.current;
		if (input) {
			input.value = methodId;
			input.dispatchEvent(new Event("change", { bubbles: true }));
		}

		if (methodProcessorType(methodId) === "4") {
			const tlpy = (window as TilopayWindow).Tilopay;
			if (tlpy?.getSinpeMovil) {
				void tlpy.getSinpeMovil().then((res) => {
					if (res?.number || res?.code) {
						setSinpeDetails({
							number: String(res.number ?? ""),
							amount: String(res.amount ?? ""),
							code: String(res.code ?? ""),
						});
					}
				});
			}
		} else {
			setSinpeDetails(null);
		}
	}, []);

	useEffect(() => {
		let cancelled = false;
		setReady(false);
		onReadyRef.current?.(false);

		async function initCheckout() {
			try {
				await loadTilopaySdk();
				if (cancelled) return;

				const tlpy = (window as TilopayWindow).Tilopay;
				if (!tlpy) {
					throw new Error("No pudimos inicializar Tilopay.");
				}

				const b = session.billingDefaults;
				const init = await tlpy.Init({
					token: session.sdkToken,
					currency: session.currency,
					language: "es",
					amount: session.amount,
					orderNumber: session.orderNumber,
					capture: 1,
					redirect: session.redirectUrl,
					webhook: session.webhookUrl,
					returnData: session.orderNumber,
					hashVersion: "V2",
					subscription: 0,
					billToFirstName: b.firstName,
					billToLastName: b.lastName,
					billToAddress: b.address,
					billToAddress2: b.city,
					billToCity: b.city,
					billToState: b.state,
					billToZipPostCode: b.zip,
					billToCountry: b.country,
					billToTelephone: b.telephone,
					billToEmail: b.email,
				});

				if (cancelled) return;

				const availableMethods = Array.isArray(init.methods) ? init.methods : [];
				if (availableMethods.length === 0) {
					throw new Error(
						init.message && init.message !== "Success"
							? init.message
							: "Tilopay no devolvió métodos de pago disponibles.",
					);
				}

				setMethods(availableMethods);
				onEnvRef.current?.(init.environment === "PROD" ? "PROD" : "TEST");
				selectMethod(availableMethods[0].id);
				setReady(true);
				onReadyRef.current?.(true);
				onErrorRef.current(null);
			} catch (err) {
				if (cancelled) return;
				setReady(false);
				onReadyRef.current?.(false);
				onErrorRef.current(
					err instanceof Error
						? err.message
						: "No pudimos cargar la pasarela de pago.",
				);
			}
		}

		const timer = window.setTimeout(() => {
			void initCheckout();
		}, 0);

		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [session, selectMethod]);

	const refreshCardPreview = useCallback(() => {
		const raw = ccRef.current?.value ?? "";
		setCardBrand(detectCardBrandLabel(raw));
		setCardNumberPreview(raw);
		if (holderRef.current) {
			setHolderPreview(holderRef.current.value);
		}
		if (expRef.current) {
			setExpiryPreview(expRef.current.value);
		}
	}, []);

	useEffect(() => {
		// Sincroniza rellenado automático del navegador (Chrome/Safari/Edge) y cambios del SDK
		const sync = () => refreshCardPreview();
		const inputs = [ccRef.current, holderRef.current, expRef.current].filter(
			Boolean,
		) as HTMLInputElement[];
		for (const el of inputs) {
			el.addEventListener("input", sync);
			el.addEventListener("change", sync);
		}
		const interval = window.setInterval(sync, 350);
		const stopTimer = window.setTimeout(() => window.clearInterval(interval), 5000);
		const timer = window.setTimeout(() => {
			for (const el of inputs) {
				if (el.value) {
					sync();
					break;
				}
			}
			if (ccRef.current && document.activeElement === document.body) {
				ccRef.current.focus();
			}
		}, 120);
		return () => {
			for (const el of inputs) {
				el.removeEventListener("input", sync);
				el.removeEventListener("change", sync);
			}
			window.clearInterval(interval);
			window.clearTimeout(stopTimer);
			window.clearTimeout(timer);
		};
	}, [refreshCardPreview]);

	const copySinpeValue = (kind: "number" | "code", value: string) => {
		if (!value || typeof navigator === "undefined") return;
		void navigator.clipboard?.writeText(value);
		setCopiedKey(kind);
		window.setTimeout(() => setCopiedKey(null), 1800);
	};

	const submitPayment = useCallback(async () => {
		if (!ready || paying) return;

		const tlpy = (window as TilopayWindow).Tilopay;
		if (!tlpy) {
			onErrorRef.current("La pasarela todavía está cargando. Intentá de nuevo.");
			return;
		}

		const isSinpe = methodProcessorType(selectedMethodId) === "4";
		const rawHolder = holderRef.current?.value?.trim() ?? "";

		if (!isSinpe && rawHolder.length < 2) {
			onErrorRef.current("Escribí el nombre como aparece en la tarjeta.");
			holderRef.current?.focus();
			return;
		}

		setPaying(true);
		onPayingRef.current?.(true);
		onErrorRef.current(null);

		try {
			const { firstName, lastName } = splitCardholderName(rawHolder, artistName);
			await tlpy.updateOptions({
				billToFirstName: firstName,
				billToLastName: lastName,
			});

			const methodId =
				selectedMethodId ||
				paymentMethodInputRef.current?.value ||
				methods.find((m) => methodProcessorType(m.id) !== "4")?.id ||
				methods[0]?.id ||
				"";
			if (paymentMethodInputRef.current && methodId) {
				paymentMethodInputRef.current.value = methodId;
			}

			onBeforeRedirect();
			const result = await tlpy.startPayment();
			if (result?.message) {
				setPaying(false);
				onPayingRef.current?.(false);
				onErrorRef.current(result.message);
				return;
			}

			if (responseContainerRef.current?.innerHTML) {
				responseContainerRef.current.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
				});
			}
		} catch (err) {
			setPaying(false);
			onPayingRef.current?.(false);
			onErrorRef.current(
				err instanceof Error
					? err.message
					: "No pudimos procesar el pago. Intentá nuevamente.",
			);
		}
	}, [ready, paying, selectedMethodId, methods, artistName, onBeforeRedirect]);

	useImperativeHandle(
		ref,
		() => ({
			submitPayment,
		}),
		[submitPayment],
	);

	const cardMethod = useMemo(
		() => methods.find((m) => methodProcessorType(m.id) !== "4") ?? methods[0] ?? null,
		[methods],
	);
	const sinpeMethod = useMemo(
		() => methods.find((m) => methodProcessorType(m.id) === "4") ?? null,
		[methods],
	);
	const isSinpeMethod = methodProcessorType(selectedMethodId) === "4";
	const formattedCardLine = formatCardDisplay(cardNumberPreview, cardBrand);

	return (
		<div className="mx-auto w-full max-w-[440px]">
			<div className="flex flex-col gap-6">
				{/* Top Bar: Amount + Method Switcher (only if SINPE exists) */}
				<div className="flex items-center justify-between gap-3">
					<div>
						<span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-grayscale-9">
							Reserva de sesión
						</span>
						<span className="font-mono text-[24px] font-semibold tracking-tight tabular-nums text-grayscale-12">
							{session.amountFormatted}
						</span>
					</div>

					{sinpeMethod ? (
						<div className="grid grid-cols-2 gap-1 rounded-lg border border-grayscale-4/70 bg-grayscale-2 p-1 dark:border-white/[0.08] dark:bg-[#131312]">
							<button
								type="button"
								onClick={() => cardMethod && selectMethod(cardMethod.id)}
								className={`relative h-8 cursor-pointer rounded-md px-3 text-[12px] font-medium transition-colors duration-150 ${
									!isSinpeMethod
										? "text-grayscale-12"
										: "text-grayscale-9 hover:text-grayscale-12"
								}`}
							>
								{!isSinpeMethod ? (
									<motion.span
										layoutId="tilopay-method-pill"
										transition={{ type: "spring", stiffness: 460, damping: 34 }}
										className="absolute inset-0 rounded-md border border-black/[0.06] bg-grayscale-1 shadow-[0_1px_2px_rgba(28,22,16,0.08)] dark:border-white/[0.12] dark:bg-[#252522]"
									/>
								) : null}
								<span className="relative z-10">Tarjeta</span>
							</button>

							<button
								type="button"
								onClick={() => selectMethod(sinpeMethod.id)}
								className={`relative h-8 cursor-pointer rounded-md px-3 text-[12px] font-medium transition-colors duration-150 ${
									isSinpeMethod
										? "text-grayscale-12"
										: "text-grayscale-9 hover:text-grayscale-12"
								}`}
							>
								{isSinpeMethod ? (
									<motion.span
										layoutId="tilopay-method-pill"
										transition={{ type: "spring", stiffness: 460, damping: 34 }}
										className="absolute inset-0 rounded-md border border-black/[0.06] bg-grayscale-1 shadow-[0_1px_2px_rgba(28,22,16,0.08)] dark:border-white/[0.12] dark:bg-[#252522]"
									/>
								) : null}
								<span className="relative z-10">SINPE Móvil</span>
							</button>
						</div>
					) : (
						<div className="flex items-center gap-2">
							<VisaLogo
								className={`h-3.5 w-auto text-[#1A1F71] transition-opacity duration-150 dark:text-[#93B4FF] ${
									cardBrand && cardBrand !== "VISA" ? "opacity-25" : "opacity-90"
								}`}
							/>
							<MastercardLogo
								className={`h-4 w-auto transition-opacity duration-150 ${
									cardBrand && cardBrand !== "MASTERCARD" ? "opacity-25" : "opacity-95"
								}`}
							/>
							<AmexLogo
								className={`h-4 w-auto transition-opacity duration-150 ${
									cardBrand && cardBrand !== "AMEX" ? "opacity-25" : "opacity-95"
								}`}
							/>
						</div>
					)}
				</div>

				{/* Interactive Crimson Card Centerpiece (estilo La Roja clean) */}
				{!isSinpeMethod ? (
					<motion.div
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
						className="mx-auto w-full max-w-[336px]"
					>
						<div
							style={{ willChange: "transform" }}
							className="relative flex aspect-[1.586/1] w-full flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-[#D1192E] via-[#BD1225] to-[#980C1C] p-5 text-white shadow-[0_2px_6px_-1px_rgba(28,22,16,0.12),inset_0_0_0_1px_rgba(255,255,255,0.14)] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.12)]"
						>
							{/* Geometric diagonal facets (subtle, non-distracting) */}
							<svg
								aria-hidden="true"
								className="pointer-events-none absolute inset-0 h-full w-full"
								viewBox="0 0 336 212"
								fill="none"
								preserveAspectRatio="none"
							>
								<path d="M180 0L336 0L336 165Z" fill="rgba(255,255,255,0.05)" />
								<path d="M85 212L250 45L336 212Z" fill="rgba(0,0,0,0.08)" />
								<path d="M0 0L125 0L55 212L0 212Z" fill="rgba(255,255,255,0.035)" />
							</svg>

							{/* Top: Chip + Contactless + GigBlades */}
							<div className="relative z-10 flex items-center justify-between">
								<div className="flex items-center gap-2.5">
									<EmvChipSvg />
									<ContactlessSvg />
								</div>
								<span className="text-[12px] font-semibold tracking-[-0.01em] text-white/90">
									GigBlades
								</span>
							</div>

							{/* Middle: Live Card Number (slot roll animation on type/autofill) */}
							<div className="relative z-10">
								<CardSlotValue
									value={formattedCardLine}
									className={`font-mono text-[17px] sm:text-[18px] font-medium tracking-[0.12em] tabular-nums transition-opacity duration-150 ${
										activeField === "number" || cardNumberPreview
											? "text-white"
											: "text-white/75"
									}`}
								/>
							</div>

							{/* Bottom: Holder + Valid Thru + Live Brand Logo */}
							<div className="relative z-10 flex items-end justify-between gap-3">
								<div className="min-w-0 flex-1">
									<span className="block text-[8.5px] font-medium uppercase tracking-[0.14em] text-white/65">
										Titular
									</span>
									<motion.span
										key={holderPreview.trim() || artistName || "placeholder"}
										initial={{ opacity: 0.45, y: 2 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
										className="mt-0.5 block truncate font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-white"
									>
										{holderPreview.trim() || artistName || "NOMBRE EN TARJETA"}
									</motion.span>
								</div>

								<div className="shrink-0 text-left">
									<span className="block text-[8.5px] font-medium uppercase tracking-[0.14em] text-white/65">
										{activeField === "cvv" ? "CVV" : "Vence"}
									</span>
									<CardSlotValue
										value={
											activeField === "cvv"
												? cardBrand === "AMEX"
													? "••••"
													: "•••"
												: formatExpiryDisplay(expiryPreview)
										}
										className="mt-0.5 font-mono text-[12px] font-medium tabular-nums text-white"
									/>
								</div>

								<div className="flex h-6 min-w-[38px] shrink-0 items-center justify-end">
									<AnimatePresence mode="wait">
										{cardBrand ? (
											<motion.div
												key={cardBrand}
												initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
												animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
												exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
												transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
											>
												<CardBrandMark brand={cardBrand} onCard />
											</motion.div>
										) : null}
									</AnimatePresence>
								</div>
							</div>
						</div>
					</motion.div>
				) : null}

				{/* Required Tilopay SDK V2 Container */}
				<div className="payFormTilopay flex flex-col gap-3.5">
					<input
						ref={paymentMethodInputRef}
						type="hidden"
						id="tlpy_payment_method"
						name="tlpy_payment_method"
						value={selectedMethodId}
						onChange={() => {}}
					/>
					<input
						ref={savedCardsInputRef}
						type="hidden"
						id="tlpy_saved_cards"
						name="tlpy_saved_cards"
						defaultValue=""
					/>

					{/* Card Inputs (Always kept mounted in DOM for Tilopay SDK listeners) */}
					<div
						id="tlpy_card_payment_div"
						className={isSinpeMethod ? "hidden" : "flex flex-col gap-3.5"}
					>
						<div>
							<label
								htmlFor="tlpy_cc_number"
								className="mb-1.5 block text-[12px] font-medium text-grayscale-11"
							>
								Número de tarjeta
							</label>
							<div
								className={`campo flex h-11 items-center gap-2.5 px-3.5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] ${
									error ? "campo-invalido shake" : ""
								}`}
							>
								<input
									id="tlpy_cc_number"
									ref={ccRef}
									type="text"
									inputMode="numeric"
									autoComplete="cc-number"
									aria-invalid={Boolean(error)}
									defaultValue=""
									placeholder="4441 2354 3266 5655"
									onFocus={() => setActiveField("number")}
									onBlur={() => setActiveField(null)}
									onKeyUp={refreshCardPreview}
									onChange={refreshCardPreview}
									className="h-full min-w-0 flex-1 border-0 bg-transparent font-mono text-[16px] sm:text-[14px] font-medium tracking-wide tabular-nums text-grayscale-12 outline-none placeholder:text-grayscale-8"
								/>
								<CardBrandMark brand={cardBrand} />
							</div>
						</div>

						<div>
							<label
								htmlFor="gb-cardholder-name"
								className="mb-1.5 block text-[12px] font-medium text-grayscale-11"
							>
								Nombre
							</label>
							<div className="campo flex h-11 items-center px-3.5 shadow-[0_1px_2px_rgba(28,22,16,0.03)]">
								<input
									id="gb-cardholder-name"
									ref={holderRef}
									type="text"
									autoComplete="cc-name"
									data-access-input
									defaultValue=""
									placeholder="Nombre y apellido"
									onFocus={() => setActiveField("name")}
									onBlur={() => setActiveField(null)}
									onChange={(e) => setHolderPreview(e.target.value)}
									className="h-full w-full border-0 bg-transparent text-[16px] sm:text-[14px] font-medium text-grayscale-12 outline-none placeholder:text-grayscale-8"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="min-w-0">
								<label
									htmlFor="tlpy_cc_expiration_date"
									className="mb-1.5 block text-[12px] font-medium text-grayscale-11"
								>
									Vencimiento
								</label>
								<div className="campo flex h-11 items-center px-3.5 shadow-[0_1px_2px_rgba(28,22,16,0.03)]">
									<input
										id="tlpy_cc_expiration_date"
										ref={expRef}
										type="text"
										inputMode="numeric"
										autoComplete="cc-exp"
										defaultValue=""
										placeholder="MM / AA"
										onFocus={() => setActiveField("expiry")}
										onBlur={() => setActiveField(null)}
										onInput={(e) => {
											const val = (e.target as HTMLInputElement).value;
											setExpiryPreview(val);
											const digits = val.replace(/\D/g, "");
											if (
												digits.length === 4 &&
												document.activeElement === expRef.current
											) {
												cvvRef.current?.focus();
											}
										}}
										onChange={(e) => setExpiryPreview(e.target.value)}
										className="h-full w-full border-0 bg-transparent font-mono text-[16px] sm:text-[14px] font-medium tabular-nums text-grayscale-12 outline-none placeholder:text-grayscale-8"
									/>
								</div>
							</div>

							<div className="min-w-0">
								<label
									htmlFor="tlpy_cvv"
									className="mb-1.5 block text-[12px] font-medium text-grayscale-11"
								>
									CVV
								</label>
								<div className="campo flex h-11 items-center gap-2 px-3.5 shadow-[0_1px_2px_rgba(28,22,16,0.03)]">
									<input
										id="tlpy_cvv"
										ref={cvvRef}
										type={showCvv ? "text" : "password"}
										inputMode="numeric"
										autoComplete="cc-csc"
										defaultValue=""
										placeholder={cardBrand === "AMEX" ? "1234" : "123"}
										onFocus={() => setActiveField("cvv")}
										onBlur={() => setActiveField(null)}
										className="h-full min-w-0 flex-1 border-0 bg-transparent font-mono text-[16px] sm:text-[14px] font-medium tabular-nums text-grayscale-12 outline-none placeholder:text-grayscale-8"
									/>
									<button
										type="button"
										onClick={() => setShowCvv((prev) => !prev)}
										aria-label={showCvv ? "Ocultar CVV" : "Mostrar CVV"}
										className="shrink-0 cursor-pointer text-grayscale-8 hover:text-grayscale-12 transition-colors duration-150"
									>
										{showCvv ? <EyeSlashIcon size={15} /> : <EyeIcon size={15} />}
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* SINPE Móvil View when active */}
					{isSinpeMethod && sinpeDetails ? (
						<motion.div
							initial={{ opacity: 0, y: 4 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
							className="card flex flex-col gap-3 p-4 text-[13px]"
						>
							<div className="flex items-center justify-between gap-2">
								<span className="text-grayscale-9">Teléfono SINPE</span>
								<button
									type="button"
									onClick={() => copySinpeValue("number", sinpeDetails.number)}
									className="inline-flex cursor-pointer items-center gap-1.5 font-mono font-semibold text-grayscale-12"
								>
									<span>{sinpeDetails.number}</span>
									{copiedKey === "number" ? (
										<CheckIcon size={13} weight="bold" className="text-green-10" />
									) : (
										<CopyIcon size={13} className="text-grayscale-8" />
									)}
								</button>
							</div>
							<div className="flex items-center justify-between gap-2">
								<span className="text-grayscale-9">Monto exacto</span>
								<span className="font-mono font-semibold text-grayscale-12">
									₡{sinpeDetails.amount}
								</span>
							</div>
							<div className="flex items-center justify-between gap-2">
								<span className="text-grayscale-9">Código detalle</span>
								<button
									type="button"
									onClick={() => copySinpeValue("code", sinpeDetails.code)}
									className="inline-flex cursor-pointer items-center gap-1.5 font-mono font-semibold text-grayscale-12"
								>
									<span>{sinpeDetails.code}</span>
									{copiedKey === "code" ? (
										<CheckIcon size={13} weight="bold" className="text-green-10" />
									) : (
										<CopyIcon size={13} className="text-grayscale-8" />
									)}
								</button>
							</div>
						</motion.div>
					) : null}

					{/* Wallet SDK containers required inside .payFormTilopay */}
					<div id="tlpy_apple_pay_button_div" className="empty:hidden" />
					<input type="hidden" id="tlpy_apple_pay_cancel" defaultValue="" />
					<div id="tlpy_google_pay_button_div" className="empty:hidden" />
					<input type="hidden" id="tlpy_google_pay_cancel" defaultValue="" />
				</div>

				{error ? (
					<p
						role="alert"
						className="shake text-[12px] font-medium text-red-11"
					>
						{error}
					</p>
				) : null}

				{/* Primary CTA + Cancel */}
				<div className="flex flex-col gap-2">
					<button
						type="submit"
						disabled={!ready || paying}
						className="flex h-11 w-full cursor-pointer items-center justify-center rounded-md border border-transparent bg-grayscale-12 px-5 text-[14px] font-medium text-grayscale-1 shadow-[0_1px_2px_rgba(28,22,16,0.14)] transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-grayscale-11 active:scale-[0.96] disabled:cursor-wait disabled:opacity-55"
					>
						{!ready
							? "Cargando pasarela…"
							: paying
								? "Procesando pago…"
								: "Confirmar pago"}
					</button>

					<button
						type="button"
						disabled={paying}
						onClick={onCancel}
						className="h-9 w-full cursor-pointer rounded-md text-[12.5px] font-medium text-grayscale-9 transition-colors duration-150 hover:text-grayscale-12 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Volver
					</button>
				</div>

				{/* 3DS container MUST live outside .payFormTilopay */}
				<div
					ref={responseContainerRef}
					id="responseTilopay"
					className="empty:hidden"
				/>
			</div>
		</div>
	);
}

export function CheckoutSummaryPanel({
	stage,
	artistName,
	email,
	phone,
	city,
	instagram,
	meetingAt,
	amountFormatted,
	paymentRequired,
	orderNumber,
	environment,
}: {
	stage: "details" | "payment" | "done";
	artistName: string;
	email: string;
	phone: string;
	city: string;
	instagram: string;
	meetingAt: string;
	amountFormatted: string;
	paymentRequired: boolean;
	orderNumber?: string | null;
	environment?: "TEST" | "PROD" | null;
}) {
	const [openAccordion, setOpenAccordion] = useState<
		"session" | "artist" | "tilopay" | null
	>("session");

	const summaryDate = useMemo(() => formatSummaryDate(meetingAt), [meetingAt]);
	const summaryTime = useMemo(() => formatSummaryTime(meetingAt), [meetingAt]);
	const displayAmount = paymentRequired ? amountFormatted : "Gratis";

	return (
		<div className="flex flex-1 flex-col justify-between gap-6">
			<div>
				<h3 className="text-[24px] sm:text-[26px] font-semibold tracking-[-0.03em] text-[#111827] leading-tight">
					Resumen de reserva
				</h3>

				{/* 3-Step Pastel Stepper */}
				<div className="mt-5 grid grid-cols-3 gap-2">
					<div className="flex items-center gap-2">
						<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DCE2FF] text-[#4C5FD5]">
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
							>
								<rect
									x="3"
									y="5"
									width="18"
									height="16"
									rx="2"
									stroke="currentColor"
									strokeWidth="1.8"
								/>
								<path
									d="M3 9H21M8 3V6M16 3V6"
									stroke="currentColor"
									strokeWidth="1.8"
									strokeLinecap="round"
								/>
							</svg>
						</span>
						<div className="min-w-0 leading-tight">
							<p className="text-[10px] text-[#9CA3AF]">Paso 1</p>
							<p
								className={`truncate text-[12px] ${
									stage === "details"
										? "font-semibold text-[#111827]"
										: "font-medium text-[#6B7280]"
								}`}
							>
								Horario
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FBD8BC] text-[#D97736]">
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
							>
								<rect
									x="3"
									y="6"
									width="18"
									height="12"
									rx="2"
									stroke="currentColor"
									strokeWidth="1.8"
								/>
								<path
									d="M3 10H21"
									stroke="currentColor"
									strokeWidth="1.8"
								/>
							</svg>
						</span>
						<div className="min-w-0 leading-tight">
							<p className="text-[10px] text-[#9CA3AF]">Paso 2</p>
							<p
								className={`truncate text-[12px] ${
									stage === "payment"
										? "font-semibold text-[#111827]"
										: "font-medium text-[#6B7280]"
								}`}
							>
								Pago
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#CBE6BC] text-[#5B8A43]">
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
							>
								<path
									d="M5 13L9 17L19 7"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</span>
						<div className="min-w-0 leading-tight">
							<p className="text-[10px] text-[#9CA3AF]">Paso 3</p>
							<p
								className={`truncate text-[12px] ${
									stage === "done"
										? "font-semibold text-[#111827]"
										: "font-medium text-[#6B7280]"
								}`}
							>
								Confirmado
							</p>
						</div>
					</div>
				</div>

				{/* Collapsible Summary Cards */}
				<div className="mt-6 flex flex-col gap-3">
					{/* Card 1: Session Details (Open by default) */}
					<div className="rounded-[12px] bg-white px-4 py-3.5">
						<button
							type="button"
							onClick={() =>
								setOpenAccordion((curr) =>
									curr === "session" ? null : "session",
								)
							}
							className="flex w-full cursor-pointer items-center justify-between text-left"
						>
							<span className="text-[13px] font-semibold text-[#111827]">
								GigBlades · Demo 1:1
							</span>
							<svg
								width="12"
								height="12"
								viewBox="0 0 12 12"
								fill="none"
								aria-hidden="true"
								className={`text-[#6B7280] transition-transform duration-150 ${
									openAccordion === "session" ? "rotate-180" : ""
								}`}
							>
								<path
									d="M3 4.5L6 7.5L9 4.5"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</button>

						{openAccordion === "session" ? (
							<div className="mt-3 flex flex-col gap-2.5 border-t border-[#F3F4F6] pt-3 text-[12.5px]">
								<div className="flex items-center justify-between gap-2 text-[#6B7280]">
									<span>Sesión en vivo (15 min)</span>
									<span className="font-medium text-[#111827] tabular-nums">
										{displayAmount}
									</span>
								</div>
								<div className="flex items-center justify-between gap-2 text-[#6B7280]">
									<span>Fecha</span>
									<span className="text-[#111827]">{summaryDate}</span>
								</div>
								<div className="flex items-center justify-between gap-2 text-[#6B7280]">
									<span>Hora Costa Rica</span>
									<span className="text-[#111827]">{summaryTime}</span>
								</div>
								<div className="flex items-center justify-between gap-2 pt-0.5 text-[#111827]">
									<span className="font-medium">Total</span>
									<span className="font-semibold tabular-nums">
										{displayAmount}
									</span>
								</div>
							</div>
						) : null}
					</div>

					{/* Card 2: Artist Info */}
					<div className="rounded-[12px] bg-white px-4 py-3.5">
						<button
							type="button"
							onClick={() =>
								setOpenAccordion((curr) =>
									curr === "artist" ? null : "artist",
								)
							}
							className="flex w-full cursor-pointer items-center justify-between text-left"
						>
							<span className="text-[13px] font-semibold text-[#111827]">
								Artista
							</span>
							<svg
								width="12"
								height="12"
								viewBox="0 0 12 12"
								fill="none"
								aria-hidden="true"
								className={`text-[#6B7280] transition-transform duration-150 ${
									openAccordion === "artist" ? "rotate-180" : ""
								}`}
							>
								<path
									d="M3 4.5L6 7.5L9 4.5"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</button>

						{openAccordion === "artist" ? (
							<div className="mt-3 flex flex-col gap-2 border-t border-[#F3F4F6] pt-3 text-[12.5px]">
								<div className="flex items-center justify-between gap-2 text-[#6B7280]">
									<span>DJ</span>
									<span className="truncate text-[#111827]">
										{artistName.trim() || "Por ingresar"}
									</span>
								</div>
								<div className="flex items-center justify-between gap-2 text-[#6B7280]">
									<span>Correo</span>
									<span className="truncate text-[#111827]">
										{email.trim() || "Por ingresar"}
									</span>
								</div>
								{city.trim() ? (
									<div className="flex items-center justify-between gap-2 text-[#6B7280]">
										<span>Provincia</span>
										<span className="text-[#111827]">{city.trim()}</span>
									</div>
								) : null}
								{instagram.trim() || phone.trim() ? (
									<div className="flex items-center justify-between gap-2 text-[#6B7280]">
										<span>{instagram.trim() ? "Instagram" : "WhatsApp"}</span>
										<span className="truncate text-[#111827]">
											{instagram.trim()
												? `@${instagram.trim().replace(/^@+/, "")}`
												: phone.trim()}
										</span>
									</div>
								) : null}
							</div>
						) : null}
					</div>

					{/* Card 3: Tilopay Details */}
					<div className="rounded-[12px] bg-white px-4 py-3.5">
						<button
							type="button"
							onClick={() =>
								setOpenAccordion((curr) =>
									curr === "tilopay" ? null : "tilopay",
								)
							}
							className="flex w-full cursor-pointer items-center justify-between text-left"
						>
							<span className="text-[13px] font-semibold text-[#111827]">
								Tilopay
							</span>
							<svg
								width="12"
								height="12"
								viewBox="0 0 12 12"
								fill="none"
								aria-hidden="true"
								className={`text-[#6B7280] transition-transform duration-150 ${
									openAccordion === "tilopay" ? "rotate-180" : ""
								}`}
							>
								<path
									d="M3 4.5L6 7.5L9 4.5"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</button>

						{openAccordion === "tilopay" ? (
							<div className="mt-3 flex flex-col gap-2 border-t border-[#F3F4F6] pt-3 text-[12.5px]">
								<div className="flex items-center justify-between gap-2 text-[#6B7280]">
									<span>Orden</span>
									<span className="font-mono text-[11px] text-[#111827]">
										{orderNumber || "Al confirmar horario"}
									</span>
								</div>
								<div className="flex items-center justify-between gap-2 text-[#6B7280]">
									<span>Protección</span>
									<span className="text-[#111827]">
										{environment === "TEST"
											? "Modo prueba · Cloudflare"
											: "Cifrado 3DS · Cloudflare"}
									</span>
								</div>
							</div>
						) : null}
					</div>
				</div>
			</div>

			{/* Bottom Total Row */}
			<div className="flex items-baseline justify-between gap-2 pt-3 border-t border-[#EAECEF]">
				<span className="text-[13.5px] font-medium text-[#6B7280]">
					Monto total:
				</span>
				<span className="text-[22px] font-bold tracking-[-0.02em] text-[#111827] tabular-nums">
					{displayAmount}
				</span>
			</div>
		</div>
	);
}
