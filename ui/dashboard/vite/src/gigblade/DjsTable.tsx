import { Input, MiniCopyButton } from "@autumn/ui";
import { GlobeIcon, ListMagnifyingGlassIcon, UsersIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, type ReactNode } from "react";
import { Table } from "@/components/general/table";
import {
	PLAN,
	toCusProductStatus,
	type DjStatus,
	type GigbladeDj,
} from "@/gigblade/concept";
import { formatUnixToDateTime } from "@/utils/formatUtils/formatDateUtils";
import { CustomerProductsStatus } from "@/views/customers2/components/table/customer-products/CustomerProductsStatus";
import { useCustomerTable } from "@/views/customers2/hooks/useCustomerTable";

type DjRow = GigbladeDj & { id: string };
export type DjsTableVariant = "roster" | "domains";

function toRows(djs: GigbladeDj[]): DjRow[] {
	return djs.map((dj) => ({ ...dj, id: dj.slug }));
}

function PlanStatusCell({
	status,
	tooltip,
}: {
	status: DjStatus;
	tooltip?: boolean;
}) {
	return (
		<CustomerProductsStatus
			status={toCusProductStatus(status)}
			trialing={status === "trialing"}
			tooltip={tooltip}
		/>
	);
}

const rosterColumns: ColumnDef<DjRow>[] = [
	{
		id: "name",
		header: "Name",
		accessorKey: "name",
		size: 130,
		cell: ({ row }) => (
			<div className="font-medium text-foreground">{row.original.name}</div>
		),
	},
	{
		id: "customer_id",
		header: "ID",
		accessorKey: "slug",
		size: 130,
		cell: ({ row }) => (
			<div className="font-mono justify-start flex w-full group">
				<MiniCopyButton text={row.original.slug} />
			</div>
		),
	},
	{
		id: "email",
		header: "Email",
		accessorKey: "email",
		size: 120,
		cell: ({ row }) => (
			<div className="truncate">
				<MiniCopyButton text={row.original.email} />
			</div>
		),
	},
	{
		id: "customer_products",
		header: "Products",
		size: 110,
		cell: ({ row }) => (
			<div className="flex min-w-0">
				<div className="flex items-center gap-2 w-full min-w-0">
					<span className="text-tertiary-foreground truncate min-w-0">
						{PLAN.name}
					</span>
					<PlanStatusCell status={row.original.status} tooltip />
				</div>
			</div>
		),
	},
	{
		id: "created_at",
		header: "Created At",
		accessorKey: "createdAt",
		size: 100,
		cell: ({ row }) => {
			const { date, time } = formatUnixToDateTime(row.original.createdAt);
			return (
				<div className="text-xs text-subtle pr-4 w-full">
					{date} <span className="truncate">{time}</span>
				</div>
			);
		},
	},
];

const domainColumns: ColumnDef<DjRow>[] = [
	{
		id: "name",
		header: "Name",
		accessorKey: "name",
		size: 130,
		cell: ({ row }) => (
			<div className="font-medium text-foreground">{row.original.name}</div>
		),
	},
	{
		id: "domain",
		header: "ID",
		accessorKey: "domain",
		size: 160,
		cell: ({ row }) => (
			<div className="font-mono justify-start flex w-full group overflow-hidden">
				<MiniCopyButton text={row.original.domain} />
			</div>
		),
	},
	{
		id: "status",
		header: "Products",
		size: 140,
		cell: ({ row }) => <PlanStatusCell status={row.original.status} />,
	},
	{
		id: "created_at",
		header: "Created At",
		accessorKey: "createdAt",
		size: 100,
		cell: ({ row }) => {
			const { date } = formatUnixToDateTime(row.original.createdAt, {
				withYear: true,
			});
			return <div className="text-subtle text-xs">{date}</div>;
		},
	},
];

export function DjsTable({
	djs,
	heading = "DJs",
	headingIcon,
	actions,
	getRowHref,
	showSearch = true,
	variant = "roster",
	virtualize = false,
	rowActions,
	isLoading = false,
	emptyStateText = "Ningún DJ coincide.",
}: {
	djs: GigbladeDj[];
	heading?: string;
	headingIcon?: ReactNode;
	actions?: ReactNode;
	getRowHref?: (dj: GigbladeDj) => string;
	showSearch?: boolean;
	variant?: DjsTableVariant;
	virtualize?: boolean;
	rowActions?: (dj: GigbladeDj) => ReactNode;
	isLoading?: boolean;
	emptyStateText?: string;
}) {
	const [query, setQuery] = useState("");
	const columns = useMemo(() => {
		const base = variant === "domains" ? domainColumns : rosterColumns;
		if (!rowActions) return base;
		return [
			...base,
			{
				id: "actions",
				header: "Acciones",
				size: 220,
				cell: ({ row }) => (
					<div
						className="flex justify-end gap-2 pr-2"
						onClick={(event) => event.stopPropagation()}
						onKeyDown={(event) => event.stopPropagation()}
					>
						{rowActions(row.original)}
					</div>
				),
			} satisfies ColumnDef<DjRow>,
		];
	}, [rowActions, variant]);
	const icon =
		headingIcon ??
		(variant === "domains" ? (
			<GlobeIcon size={16} weight="fill" className="text-subtle" aria-hidden />
		) : (
			<UsersIcon size={16} weight="fill" className="text-subtle" aria-hidden />
		));
	const rows = useMemo(() => {
		const all = toRows(djs);
		const needle = query.trim().toLowerCase();
		if (!needle) return all;
		return all.filter((dj) =>
			[dj.name, dj.email, dj.domain, dj.city, dj.slug, dj.template]
				.join(" ")
				.toLowerCase()
				.includes(needle),
		);
	}, [djs, query]);

	const table = useCustomerTable({
		data: rows,
		columns,
	});

	return (
		<Table.Provider
			config={{
				table,
				numberOfColumns: columns.length,
				enableSorting: false,
				isLoading,
				emptyStateText,
				rowClassName: "h-10",
				flexibleTableColumns: true,
				getRowHref: getRowHref
					? (row: DjRow) => getRowHref(row)
					: undefined,
				virtualization: virtualize
					? {
							containerHeight: "calc(100vh - 190px)",
							rowHeight: 40,
						}
					: undefined,
			}}
		>
			<div>
				<Table.Toolbar>
					<Table.Heading>
						{icon}
						{heading}
					</Table.Heading>
					{actions ? <Table.Actions>{actions}</Table.Actions> : null}
				</Table.Toolbar>
				{showSearch ? (
					<div className="flex flex-wrap items-center gap-2 pb-4">
						<div className="relative flex items-center flex-1 min-w-0">
							<ListMagnifyingGlassIcon
								size={16}
								aria-hidden
								className="text-tertiary-foreground absolute left-2.5 pointer-events-none"
							/>
							<Input
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								className="pl-8! text-sm w-full"
								placeholder="Buscar DJs"
								aria-label="Buscar DJs"
							/>
						</div>
					</div>
				) : null}
				<Table.Container>
					{virtualize ? (
						<Table.VirtualizedContent>
							<Table.VirtualizedBody />
						</Table.VirtualizedContent>
					) : (
						<Table.Content>
							<Table.Header />
							<Table.Body />
						</Table.Content>
					)}
				</Table.Container>
			</div>
		</Table.Provider>
	);
}
