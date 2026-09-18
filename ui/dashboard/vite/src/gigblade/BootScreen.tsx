export function BootScreen({
	message = "Abriendo panel",
}: {
	message?: string;
}) {
	return (
		<div
			role="status"
			aria-label={message}
			className="flex min-h-full w-full flex-col gap-6 p-6 sm:p-10"
		>
			<span className="sr-only">{message}</span>
			<div
				aria-hidden="true"
				className="h-3 w-24 rounded-md bg-interactive-secondary"
			/>
			<div
				aria-hidden="true"
				className="h-7 w-64 max-w-[70%] rounded-md bg-interactive-secondary"
			/>
			<div
				aria-hidden="true"
				className="mt-2 h-28 rounded-lg bg-interactive-secondary"
			/>
			<div
				aria-hidden="true"
				className="h-28 rounded-lg bg-interactive-secondary"
			/>
		</div>
	);
}
