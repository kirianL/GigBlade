import { PageContainer, PageHeader } from "@autumn/ui";
import { GlobeIcon } from "@phosphor-icons/react";
import { GIGBLADE_DJS, PLAN } from "@/gigblade/concept";
import { DjsTable } from "@/gigblade/DjsTable";

export default function PlatformDomains() {
	return (
		<PageContainer>
			<PageHeader
				icon={
					<GlobeIcon
						size={16}
						weight="fill"
						className="text-subtle"
						aria-hidden
					/>
				}
				title="Dominios"
			/>
			<p className="text-sm text-tertiary-foreground leading-6 -mt-2 max-w-3xl">
				{PLAN.domainNote}
			</p>
			<DjsTable
				djs={GIGBLADE_DJS}
				variant="domains"
				virtualize
				heading="A nombre de GigBlade"
				headingIcon={
					<GlobeIcon
						size={16}
						weight="fill"
						className="text-subtle"
						aria-hidden
					/>
				}
				getRowHref={(dj) => `/studio?dj=${dj.slug}`}
			/>
		</PageContainer>
	);
}
