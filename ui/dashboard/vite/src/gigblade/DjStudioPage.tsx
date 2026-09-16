import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
	Button,
	CopyButton,
} from "@autumn/ui";
import { ArrowSquareOutIcon, PackageIcon } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router";
import { Table } from "@/components/general/table";
import {
	djInstagramUrl,
	djMailto,
	djPublicUrl,
	PLAN,
	toCusProductStatus,
} from "@/gigblade/concept";
import {
	DjSelect,
	DjStatusCell,
	PageContainer,
} from "@/gigblade/ui";
import { useDjProfile } from "@/gigblade/useDjContent";
import { formatUnixToDateTime } from "@/utils/formatUtils/formatDateUtils";
import { CustomerProductsStatus } from "@/views/customers2/components/table/customer-products/CustomerProductsStatus";
import { useCustomerTable } from "@/views/customers2/hooks/useCustomerTable";

type PlanRow = {
	id: string;
	name: string;
	price: string;
	status: ReturnType<typeof toCusProductStatus>;
	trialing: boolean;
	created_at: number;
};

const columns: ColumnDef<PlanRow>[] = [
	{
		header: "Name",
		accessorKey: "name",
		size: 150,
		cell: ({ row }) => (
			<div className="font-medium text-foreground">{row.original.name}</div>
		),
	},
	{
		header: "Price",
		accessorKey: "price",
		size: 120,
		cell: ({ row }) => (
			<span className="text-tertiary-foreground">{row.original.price}</span>
		),
	},
	{
		header: "Status",
		accessorKey: "status",
		size: 110,
		cell: ({ row }) => (
			<CustomerProductsStatus
				status={row.original.status}
				trialing={row.original.trialing}
			/>
		),
	},
	{
		header: "Created At",
		accessorKey: "created_at",
		size: 150,
		cell: ({ row }) => {
			const { date, time } = formatUnixToDateTime(row.original.created_at, {
				withYear: true,
			});
			return (
				<div className="text-xs text-subtle pr-4 w-full">
					{date} <span className="truncate">{time}</span>
				</div>
			);
		},
	},
];

export default function DjStudioPage() {
	const { dj, setDj } = useDjProfile();
	const pageUrl = djPublicUrl(dj);
	const instagramUrl = djInstagramUrl(dj);
	const mailUrl = djMailto(dj);

	const rows: PlanRow[] = [
		{
			id: "todo-incluido",
			name: PLAN.name,
			price: `US$ ${PLAN.priceUsd} /mo`,
			status: toCusProductStatus(dj.status),
			trialing: dj.status === "trialing",
			created_at: dj.createdAt,
		},
	];
	const table = useCustomerTable({ data: rows, columns });

	return (
		<PageContainer>
			<div className="flex items-center justify-between w-full gap-4">
				<Breadcrumb className="text-tertiary-foreground flex justify-start">
					<BreadcrumbList className="text-tertiary-foreground text-xs">
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to={`/studio?dj=${dj.slug}`}>Mi página</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem className="truncate max-w-36">
							<span className="truncate">{dj.name}</span>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<div className="flex items-center gap-2">
					<DjSelect value={dj.slug} onValueChange={setDj} />
					<Button variant="secondary" size="sm" asChild>
						<a href={pageUrl} target="_blank" rel="noreferrer">
							<ArrowSquareOutIcon size={16} aria-hidden />
							Abrir página
						</a>
					</Button>
				</div>
			</div>

			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<h3 className="text-md font-semibold truncate min-w-0 max-w-full sm:max-w-sm text-foreground">
						{dj.name}
					</h3>
					<DjStatusCell status={dj.status} />
				</div>
				<div className="flex gap-2 flex-wrap min-w-0">
					<CopyButton
						text={dj.email}
						title={dj.email}
						size="mini"
						className="text-tertiary-foreground"
						innerClassName="max-w-30 text-tiny-id truncate !font-normal"
					/>
					<CopyButton
						text={dj.domain}
						title={dj.domain}
						size="mini"
						className="text-tertiary-foreground"
						innerClassName="max-w-30 text-tiny-id truncate !font-normal"
					/>
				</div>
			</div>

			<div className="flex flex-col gap-16 w-full">
				<Table.Provider
					config={{
						table,
						numberOfColumns: columns.length,
						enableSorting: false,
						flexibleTableColumns: true,
						rowClassName: "h-10",
					}}
				>
					<Table.Container>
						<Table.Toolbar>
							<Table.Heading>
								<PackageIcon
									size={16}
									weight="fill"
									className="text-subtle"
									aria-hidden
								/>
								Plan
							</Table.Heading>
							<Table.Actions>
								<Button variant="secondary" size="sm" asChild>
									<a href={instagramUrl} target="_blank" rel="noreferrer">
										{dj.instagram}
									</a>
								</Button>
								<Button variant="secondary" size="sm" asChild>
									<a href={mailUrl}>{dj.email}</a>
								</Button>
								<Button variant="secondary" size="sm" asChild>
									<Link to={`/studio/content?dj=${dj.slug}`}>
										Editar contenido
									</Link>
								</Button>
							</Table.Actions>
						</Table.Toolbar>
						<Table.Content>
							<Table.Header />
							<Table.Body />
						</Table.Content>
					</Table.Container>
				</Table.Provider>
			</div>
		</PageContainer>
	);
}
