"use client";

import { ScreenReaderLoading } from "@/components/general/ScreenReaderLoading";

export { BootScreen } from "@/gigblade/BootScreen";

function LoadingScreen(_props?: { fullPage?: boolean }) {
	return <ScreenReaderLoading />;
}

export default LoadingScreen;
