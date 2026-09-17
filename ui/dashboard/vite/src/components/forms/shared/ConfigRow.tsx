import type { ReactNode } from "react";

/**
 * Consistent label + control row used across plan config and advanced sections.
 * Pass `expanded` to show or hide children; omit it to render children statically.
 */
export function ConfigRow({
	title,
	description,
	action,
	children,
	expanded,
}: {
	title: string;
	description?: string;
	action?: ReactNode;
	children?: ReactNode;
	expanded?: boolean;
}) {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-3">
				<div className="flex flex-col gap-px min-w-0">
					<span className="text-sm font-medium text-foreground">{title}</span>
					{description && (
						<span className="text-xs leading-snug text-tertiary-foreground/70">
							{description}
						</span>
					)}
				</div>
				{action && <div className="flex shrink-0">{action}</div>}
			</div>
			{expanded !== undefined ? (
				expanded && children ? (
					<div className="overflow-hidden">{children}</div>
				) : null
			) : (
				children
			)}
		</div>
	);
}
