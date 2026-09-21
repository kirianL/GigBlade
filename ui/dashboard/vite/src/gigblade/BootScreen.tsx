import { ScreenReaderLoading } from "@/components/general/ScreenReaderLoading";

export function BootScreen({
	message = "Abriendo panel",
}: {
	message?: string;
}) {
	return <ScreenReaderLoading label={message} />;
}
