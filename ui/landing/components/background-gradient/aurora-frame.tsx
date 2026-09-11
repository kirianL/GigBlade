export function AuroraFrame() {
	return (
		<div
			aria-hidden="true"
			className="aurora-frame-lines pointer-events-none absolute inset-0 z-10 flex justify-end gap-3 overflow-hidden will-change-transform"
		>
			{Array.from({ length: 16 }, (_, index) => (
				<div
					key={index}
					className="h-full border-r border-[#292929]"
				/>
			))}
		</div>
	);
}
