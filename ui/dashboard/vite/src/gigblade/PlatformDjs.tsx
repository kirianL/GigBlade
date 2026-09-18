import { Button, PageContainer } from "@autumn/ui";
import { Link } from "react-router";
import { DeleteDjButton } from "@/gigblade/DeleteDjButton";
import { DjsTable } from "@/gigblade/DjsTable";
import { usePlatformDjs } from "@/gigblade/usePlatformDjs";
import { useSession } from "@/lib/auth-client";

export default function PlatformDjs() {
	const { djs, remove } = usePlatformDjs();
	const { data: session } = useSession();
	const isPlatform =
		(session?.user as { role?: string } | undefined)?.role === "platform";

	return (
		<PageContainer>
			<DjsTable
				djs={djs}
				virtualize
				rowActions={(dj) => (
					<>
						<Button variant="secondary" size="sm" asChild>
							<Link to={`/studio?dj=${dj.slug}`}>Abrir</Link>
						</Button>
						{isPlatform ? (
							<DeleteDjButton
								slug={dj.slug}
								name={dj.name}
								onDeleted={remove}
							/>
						) : null}
					</>
				)}
			/>
		</PageContainer>
	);
}
