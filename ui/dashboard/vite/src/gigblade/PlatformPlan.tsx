import { MiniCopyButton, PageContainer, PageHeader, SectionTag } from "@autumn/ui";
import { CubeIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Table } from "@/components/general/table";
import {
	GIGBLADE_DJS,
	PLAN,
	payingDjCount,
} from "@/gigblade/concept";
import { formatUnixToDateTime } from "@/utils/formatUtils/formatDateUtils";
import { useCustomerTable } from "@/views/customers2/hooks/useCustomerTable";

type PlanRow = {
	id: string;
	name: string;
	active_count: number;
	created_at: number;
};

type IncludeRow = { id: string; item: string };

const planColumns: ColumnDef<PlanRow>[] = [
	{
		size: 300,
		header: "Name",
		accessorKey: "name",
		cell: ({ row }) => (
			<div className="flex items-center gap-2 min-w-0">
				<span className="truncate font-medium">{row.original.name}</span>
			</div>
		),
	},
	{
		header: "ID",
		accessorKey: "id",
		cell: ({ row }) => (
			<div className="font-mono justify-start flex w-full group overflow-hidden">
				<MiniCopyButton text={row.original.id} />
			</div>
		),
	},
	{
		header: "DJs",
		accessorKey: "active_count",
		cell: ({ row }) => (
			<div className="text-muted-foreground">{row.original.active_count}</div>
		),
	},
	{
		header: "Created",
		accessorKey: "created_at",
		size: 100,
		cell: ({ row }) => (
			<div className="text-subtle text-xs">
				{formatUnixToDateTime(row.original.created_at).date}
			</div>
		),
	},
];

const includeColumns: ColumnDef<IncludeRow>[] = [
	{
		header: "Name",
		accessorKey: "item",
		cell: ({ row }) => (
			<span className="text-tertiary-foreground">{row.original.item}</span>
		),
	},
];

export default function PlatformPlan() {
	const planRows: PlanRow[] = [
		{
			id: "todo-incluido",
			name: PLAN.name,
			active_count: payingDjCount(),
			created_at: GIGBLADE_DJS[0]?.createdAt ?? Date.now(),
		},
	];
	const includeRows: IncludeRow[] = PLAN.includes.map((item) => ({
		id: item,
		item,
	}));

	const planTable = useCustomerTable({ data: planRows, columns: planColumns });
	const includeTable = useCustomerTable({
		data: includeRows,
		columns: includeColumns,
	});

	return (
		<PageContainer>
			<PageHeader
				icon={
					<CubeIcon
						size={16}
						weight="fill"
						className="text-subtle"
						aria-hidden
					/>
				}
				title="Plan"
			/>
			<p className="text-sm text-tertiary-foreground leading-6 -mt-2 max-w-3xl">
				Un solo plan. Página, seguridad y hosting. El dominio se cobra al
				costo, a nombre de GigBlade.
			</p>

			<div className="flex flex-col gap-8">
				<Table.Provider
					config={{
						table: planTable,
						numberOfColumns: planColumns.length,
						enableSorting: false,
						rowClassName: "h-10",
					}}
				>
					<Table.Container>
						<SectionTag>Plan</SectionTag>
						<Table.Content>
							<Table.Header />
							<Table.Body />
						</Table.Content>
					</Table.Container>
				</Table.Provider>

				<Table.Provider
					config={{
						table: includeTable,
						numberOfColumns: includeColumns.length,
						enableSorting: false,
						rowClassName: "h-10",
					}}
				>
					<Table.Container>
						<SectionTag>Included</SectionTag>
						<Table.Content>
							<Table.Header />
							<Table.Body />
						</Table.Content>
					</Table.Container>
				</Table.Provider>
			</div>

			<p className="text-xs text-subtle">{PLAN.domainNote}</p>
		</PageContainer>
	);
}
