import {
	PageContainer,
	PageHeader,
} from "@autumn/ui";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useSearchParams } from "react-router";
import {
	GIGBLADE_DJS,
	LAST_DJ_STORAGE_KEY,
	djBySlug,
	toCusProductStatus,
	type DjStatus,
} from "@/gigblade/concept";
import { useLocalStorage } from "@/hooks/common/useLocalStorage";
import { CustomerProductsStatus } from "@/views/customers2/components/table/customer-products/CustomerProductsStatus";

export { PageContainer, PageHeader };

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
	value: string;
	suffix?: string;
	asideValue?: string;
	asideLabel?: string;
}) {
	return (
		<div className="border rounded-lg bg-interactive-secondary px-5 py-4 flex items-center justify-between">
			<div className="flex items-center gap-3">
				<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
					{icon}
				</div>
				<div>
					<p className="text-xs text-tertiary-foreground w-fit">{label}</p>
					<p className="text-lg font-semibold text-foreground tabular-nums">
						{value}
						{suffix ? (
							<span className="text-xs font-normal text-subtle ml-1">
								{suffix}
							</span>
						) : null}
					</p>
				</div>
			</div>
			{asideValue ? (
				<div className="text-right">
					<p className="text-lg font-semibold text-muted-foreground tabular-nums">
						{asideValue}
					</p>
					<p className="text-xs text-subtle">{asideLabel}</p>
				</div>
			) : null}
		</div>
	);
}

export function useSelectedDj() {
	const [params, setParams] = useSearchParams();
	const [lastSlug, setLastSlug] = useLocalStorage(LAST_DJ_STORAGE_KEY, "nox");
	const paramDj = params.get("dj");
	const requested = paramDj || lastSlug || "nox";
	const dj = djBySlug(requested);

	useEffect(() => {
		if (lastSlug !== dj.slug) {
			setLastSlug(dj.slug);
		}
	}, [dj.slug, lastSlug, setLastSlug]);

	useEffect(() => {
		if (paramDj === dj.slug) return;
		setParams(
			(current) => {
				if (current.get("dj") === dj.slug) return current;
				const next = new URLSearchParams(current);
				next.set("dj", dj.slug);
				return next;
			},
			{ replace: true },
		);
	}, [dj.slug, paramDj, setParams]);

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

	return { dj, setDj };
}

export function DjSelect({
	value,
	onValueChange,
}: {
	value: string;
	onValueChange: (slug: string) => void;
}) {
	return (
		<select
			aria-label="Elegí un DJ"
			value={value}
			onChange={(event) => onValueChange(event.target.value)}
			className={SELECT_CLASS}
		>
			{GIGBLADE_DJS.map((dj) => (
				<option key={dj.slug} value={dj.slug}>
					{dj.name}
				</option>
			))}
		</select>
	);
}
