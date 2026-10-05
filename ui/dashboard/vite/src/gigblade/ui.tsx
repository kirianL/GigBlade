import {
	PageContainer,
	PageHeader,
	Button,
} from "@autumn/ui";
import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useSearchParams } from "react-router";
import {
	GIGBLADE_DJS,
	LAST_DJ_STORAGE_KEY,
	djBySlug,
	toCusProductStatus,
	type DjStatus,
	type GigbladeDj,
} from "@/gigblade/concept";
import { useLocalStorage } from "@/hooks/common/useLocalStorage";
import { useSession } from "@/lib/auth-client";
import { usePlatformDjs } from "@/gigblade/usePlatformDjs";
import { CustomerProductsStatus } from "@/views/customers2/components/table/customer-products/CustomerProductsStatus";

export { PageContainer, PageHeader };

export function OpenPublicPageButton({
	href,
	label = "Abrir página",
}: {
	href: string | null;
	label?: string;
}) {
	if (!href) {
		return (
			<Button
				variant="secondary"
				size="sm"
				disabled
				aria-label={`${label}. El dominio propio todavía no está asignado.`}
			>
				<ArrowSquareOutIcon size={16} aria-hidden />
				{label}
			</Button>
		);
	}

	return (
		<Button variant="secondary" size="sm" asChild>
			<a href={href} target="_blank" rel="noreferrer">
				<ArrowSquareOutIcon size={16} aria-hidden />
				{label}
			</a>
		</Button>
	);
}

const SELECT_CLASS =
	"h-7 min-w-[160px] rounded-lg border border-input bg-input-background px-2 text-sm text-foreground outline-none shadow-sm input-base input-shadow-default";

export function DjStatusCell({ status }: { status: DjStatus }) {
	return (
		<CustomerProductsStatus
			status={toCusProductStatus(status)}
			trialing={status === "trialing"}
		/>
	);
}

export function MetricCard({
	icon,
	label,
	value,
	suffix,
	asideValue,
	asideLabel,
}: {
	icon: ReactNode;
	label: string;
	value: ReactNode;
	suffix?: string;
	asideValue?: string;
	asideLabel?: string;
}) {
	return (
		<div className="flex items-center justify-between gap-4 rounded-lg border bg-interactive-secondary px-5 py-4">
			<div className="flex min-w-0 items-center gap-3">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
					{icon}
				</div>
				<div className="min-w-0">
					<p className="w-fit text-xs leading-4 text-tertiary-foreground">
						{label}
					</p>
					<div className="mt-0.5 flex items-baseline gap-1 text-lg font-semibold leading-none text-foreground tabular-nums">
						{value}
						{suffix ? (
							<span className="text-xs font-normal leading-none text-subtle">
								{suffix}
							</span>
						) : null}
					</div>
				</div>
			</div>
			{asideValue ? (
				<div className="shrink-0 text-right">
					<p className="text-lg font-semibold leading-none text-muted-foreground tabular-nums">
						{asideValue}
					</p>
					<p className="mt-1 text-xs leading-4 text-subtle">{asideLabel}</p>
				</div>
			) : null}
		</div>
	);
}

function djFromAccount(user: {
	slug?: string;
	name?: string;
	email?: string;
}): GigbladeDj | null {
	if (!user.slug) return null;
	const seed = GIGBLADE_DJS.find((dj) => dj.slug === user.slug);
	return {
		slug: user.slug,
		name: user.name || seed?.name || user.slug,
		email: user.email || seed?.email || "",
		domain: seed?.domain ?? "",
		city: seed?.city ?? "",
		template: seed?.template ?? "after",
		status: "active",
		bio: seed?.bio ?? "",
		instagram: seed?.instagram ?? "",
		createdAt: seed?.createdAt ?? Date.now(),
	};
}

export function useSelectedDj() {
	const [params, setParams] = useSearchParams();
	const [lastSlug, setLastSlug] = useLocalStorage(LAST_DJ_STORAGE_KEY, "");
	const { data: session } = useSession();
	const user = session?.user as
		| { role?: string; slug?: string; name?: string; email?: string }
		| undefined;
	const { djs, status: sitesStatus } = usePlatformDjs();
	const lockedSlug = user?.role === "dj" ? user.slug : undefined;
	const paramDj = params.get("dj");
	const requested = lockedSlug || paramDj || lastSlug || "";
	const liveDj =
		user?.role === "platform" && sitesStatus === "ready"
			? (djs.find((item) => item.slug === requested) ?? djs[0])
			: undefined;
	const accountDj = lockedSlug ? djFromAccount(user ?? {}) : null;
	const dj = liveDj ?? accountDj ?? djBySlug(requested || "marco");
	const visitsReady = Boolean(liveDj || accountDj);
	const sitesReady = visitsReady || sitesStatus === "error";

	useEffect(() => {
		if (!visitsReady || lastSlug === dj.slug) return;
		setLastSlug(dj.slug);
	}, [visitsReady, dj.slug, lastSlug, setLastSlug]);

	useEffect(() => {
		if (!visitsReady || paramDj === dj.slug) return;
		setParams(
			(current) => {
				if (current.get("dj") === dj.slug) return current;
				const next = new URLSearchParams(current);
				next.set("dj", dj.slug);
				return next;
			},
			{ replace: true },
		);
	}, [visitsReady, dj.slug, paramDj, setParams]);

	const setDj = (slug: string) => {
		if (slug === dj.slug && paramDj === slug) return;
		setLastSlug(slug);
		setParams(
			(current) => {
				if (current.get("dj") === slug) return current;
				const next = new URLSearchParams(current);
				next.set("dj", slug);
				return next;
			},
			{ replace: true },
		);
	};

	return { dj, setDj, sitesReady, visitsReady };
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

	const options = djs;

	return (
		<select
			aria-label="Elegí un DJ"
			value={value}
			onChange={(event) => onValueChange(event.target.value)}
			className={SELECT_CLASS}
		>
			{options.map((dj) => (
				<option key={dj.slug} value={dj.slug}>
					{dj.name}
				</option>
			))}
		</select>
	);
}
