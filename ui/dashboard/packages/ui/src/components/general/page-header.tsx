import type { ReactNode } from "react";

/**
 * Shared page header: leading icon + title on the left, optional actions on
 * the right. Matches Table.Toolbar + Table.Heading styles.
 */
export function PageHeader({
	icon,
	title,
	children,
}: {
	icon: ReactNode;
	title: string;
	children?: ReactNode;
}) {
	return (
		<div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
			<div className="text-muted-foreground text-md py-0 px-0 sm:px-2 rounded-lg flex gap-2 items-center min-w-0">
				<span className="shrink-0">{icon}</span>
				<span className="font-semibold text-foreground text-base sm:text-lg leading-snug break-words min-w-0">
					{title}
				</span>
			</div>
			{children && (
				<div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
					{children}
				</div>
			)}
		</div>
	);
}
