import { ListIcon } from "@phosphor-icons/react";

/** Thin sticky bar shown only on mobile with hamburger menu trigger. */
export function MobileTopBar({ onMenuClick }: { onMenuClick: () => void }) {
	return (
		<div className="gigblade-safe-bar sticky top-0 z-50 flex shrink-0 items-center border-b border-border/40 bg-background px-3 sm:hidden">
			<button
				type="button"
				onClick={onMenuClick}
				className="flex size-8 items-center justify-center -ml-1 rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
				aria-label="Abrir menú"
			>
				<ListIcon size={18} weight="bold" aria-hidden />
			</button>
		</div>
	);
}
