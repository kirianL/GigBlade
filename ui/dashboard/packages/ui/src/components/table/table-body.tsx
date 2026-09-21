import { useTableContext } from "@autumn/ui/components/table/table-context";
import {
	MotionTbody,
	TABLE_FADE_IN,
	TABLE_TRANSITION,
} from "@autumn/ui/components/table/table-motion";
import { TableRowCells } from "@autumn/ui/components/table/table-row-cells";
import { TableCell, TableRow } from "@autumn/ui/components/ui/table";
import { cn } from "@autumn/ui/lib/utils";
import { useEffect, useRef } from "react";

export function TableBody() {
	const {
		table,
		numberOfColumns,
		enableSelection,
		isLoading,
		isTransitioning,
		getRowHref,
		onRowClick,
		onRowDoubleClick,
		rowClassName,
		emptyStateChildren,
		emptyStateText,
		selectedItemId,
		flexibleTableColumns,
		getRowClassName,
	} = useTableContext();
	const rows = table.getRowModel().rows;
	const hasLoadedRef = useRef(false);

	useEffect(() => {
		if (!isLoading) hasLoadedRef.current = true;
	});

	const hasRows = rows.length > 0;
	const hasLoaded = hasLoadedRef.current || !isLoading;
	const waitingForData =
		isLoading || !!isTransitioning || (!hasRows && !hasLoaded);

	if (waitingForData && !hasRows) {
		return (
			<MotionTbody key="loading" {...TABLE_FADE_IN} transition={TABLE_TRANSITION}>
				<TableRow className="hover:bg-transparent dark:hover:bg-transparent">
					<TableCell
						className="h-10 py-0"
						colSpan={numberOfColumns}
					>
						<span className="sr-only">Cargando</span>
					</TableCell>
				</TableRow>
			</MotionTbody>
		);
	}

	if (!hasRows) {
		return (
			<MotionTbody key="empty" {...TABLE_FADE_IN} transition={TABLE_TRANSITION}>
				<TableRow className="hover:bg-transparent dark:hover:bg-transparent">
					<TableCell
						className="h-10 text-center py-0"
						colSpan={numberOfColumns}
					>
						<div className="text-subtle text-xs text-center w-full h-full items-center justify-center flex">
							{emptyStateChildren || emptyStateText}
						</div>
					</TableCell>
				</TableRow>
			</MotionTbody>
		);
	}

	const visibleColumnKey = table
		.getVisibleLeafColumns()
		.map((col) => col.id)
		.join(",");

	return (
		<MotionTbody
			key="content"
			{...TABLE_FADE_IN}
			transition={TABLE_TRANSITION}
			className="divide-y bg-interactive-secondary"
		>
			{rows.map((row) => {
				const isSelected = selectedItemId === (row.original as any).id;
				const rowHref = getRowHref?.(row.original);

				return (
					<TableRow
						className={cn(
							"text-tertiary-foreground transition-none h-12 py-4 relative",
							rowClassName,
							getRowClassName?.(row.original),
							isSelected ? "z-100" : "hover:bg-interactive-secondary-hover",
							(onRowClick || rowHref) && "cursor-pointer",
						)}
						data-state={row.getIsSelected() && "selected"}
						key={row.id}
						onClick={!rowHref ? () => onRowClick?.(row.original) : undefined}
						onDoubleClick={
							onRowDoubleClick
								? () => onRowDoubleClick(row.original)
								: undefined
						}
					>
						<TableRowCells
							row={row}
							enableSelection={enableSelection}
							flexibleTableColumns={flexibleTableColumns}
							rowHref={rowHref}
							visibleColumnKey={visibleColumnKey}
							isExpanded={row.getIsExpanded()}
						/>
					</TableRow>
				);
			})}
		</MotionTbody>
	);
}
