export function ScreenReaderLoading({
	label = "Cargando",
}: {
	label?: string;
}) {
	return (
		<div role="status" aria-live="polite" aria-label={label} className="sr-only">
			{label}
		</div>
	);
}
