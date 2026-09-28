import { PageContainer, PageHeader } from "@autumn/ui";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { fetchPlatformWaitlist, type WaitlistSignup } from "@/gigblade/site-api";

export const PLATFORM_WAITLIST_QUERY_KEY = ["platform", "waitlist"] as const;

const STATUS_LABEL: Record<WaitlistSignup["status"], string> = {
	pending: "Pendiente",
	contacted: "Contactado",
	onboarded: "En la plataforma",
	declined: "Descartado",
};

function formatSignupDate(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat("es-CR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
}

function SignupRow({ signup }: { signup: WaitlistSignup }) {
	const instagram = signup.instagram
		? `https://instagram.com/${signup.instagram}`
		: null;

	return (
		<li className="border rounded-lg bg-interactive-secondary p-4 sm:p-5 flex flex-col gap-2">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-sm font-medium text-foreground truncate">
						{signup.artistName}
					</p>
					<a
						href={`mailto:${signup.email}`}
						className="mt-1 block text-sm text-foreground underline-offset-2 hover:underline break-all"
					>
						{signup.email}
					</a>
					{signup.phone ? (
						<a
							href={`tel:${signup.phone.replace(/[^\d+]/g, "")}`}
							className="mt-1 block text-sm text-foreground underline-offset-2 hover:underline"
						>
							{signup.phone}
						</a>
					) : null}
				</div>
				<p className="text-xs font-medium text-tertiary-foreground">
					{STATUS_LABEL[signup.status]}
				</p>
			</div>
			<p className="text-xs text-tertiary-foreground">
				{signup.city ? `${signup.city} · ` : ""}
				{formatSignupDate(signup.createdAt)}
				{instagram ? (
					<>
						{" · "}
						<a
							href={instagram}
							target="_blank"
							rel="noreferrer"
							className="underline-offset-2 hover:underline"
						>
							@{signup.instagram}
						</a>
					</>
				) : null}
			</p>
			{signup.note ? (
				<p className="text-sm text-foreground leading-6">{signup.note}</p>
			) : null}
		</li>
	);
}

export default function PlatformWaitlist() {
	const query = useQuery({
		queryKey: PLATFORM_WAITLIST_QUERY_KEY,
		queryFn: ({ signal }) => fetchPlatformWaitlist(signal),
		staleTime: 15_000,
		retry: 1,
	});
	const signups = query.data ?? [];
	const pending = signups.filter((signup) => signup.status === "pending").length;

	return (
		<PageContainer>
			<PageHeader
				icon={
					<EnvelopeSimpleIcon
						size={16}
						weight="fill"
						className="text-subtle"
						aria-hidden
					/>
				}
				title="Lista de espera"
			/>
			<p className="text-sm text-tertiary-foreground leading-6 -mt-2 max-w-3xl">
				{query.isPending
					? "Cargando solicitudes…"
					: query.isError
						? "No se pudieron cargar las solicitudes. Recargá la página."
						: pending === 1
							? "1 solicitud pendiente de cupo."
							: `${pending} solicitudes pendientes de cupo.`}
			</p>
			{query.isError ? null : signups.length === 0 && !query.isPending ? (
				<p className="text-sm text-tertiary-foreground">Todavía no hay solicitudes.</p>
			) : (
				<ul className="flex flex-col gap-3" aria-label="Solicitudes de la lista de espera">
					{signups.map((signup) => (
						<SignupRow key={signup.id} signup={signup} />
					))}
				</ul>
			)}
		</PageContainer>
	);
}
