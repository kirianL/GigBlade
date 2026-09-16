import {
	PageContainer,
	PageHeader,
	SearchableSelect,
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
	const requested = params.get("dj") || lastSlug || "nox";
	const dj = djBySlug(requested);

	const paramDj = params.get("dj");

	useEffect(() => {
		if (lastSlug !== dj.slug) {
			setLastSlug(dj.slug);
		}
		if (paramDj !== dj.slug) {
			const next = new URLSearchParams(params);
			next.set("dj", dj.slug);
			setParams(next, { replace: true });
		}
	}, [dj.slug, lastSlug, paramDj, params, setLastSlug, setParams]);

	const setDj = (slug: string) => {
		setLastSlug(slug);
		const next = new URLSearchParams(params);
		next.set("dj", slug);
		setParams(next, { replace: true });
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
		<SearchableSelect
			value={value}
			onValueChange={onValueChange}
			options={GIGBLADE_DJS}
			getOptionValue={(dj) => dj.slug}
			getOptionLabel={(dj) => dj.name}
			getOptionSearchTerms={(dj) => [dj.domain, dj.email, dj.city]}
			searchable
			searchPlaceholder="Buscar DJs"
			placeholder="Elegí un DJ"
			emptyText="Ningún DJ coincide"
			triggerClassName="h-7 min-w-[160px]"
		/>
	);
}
