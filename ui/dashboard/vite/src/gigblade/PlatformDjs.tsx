import { PageContainer } from "@autumn/ui";
import { GIGBLADE_DJS } from "@/gigblade/concept";
import { DjsTable } from "@/gigblade/DjsTable";

export default function PlatformDjs() {
	return (
		<PageContainer>
			<DjsTable
				djs={GIGBLADE_DJS}
				virtualize
				getRowHref={(dj) => `/studio?dj=${dj.slug}`}
			/>
		</PageContainer>
	);
}
