import { Component, type ReactNode } from "react";
import { BootScreen } from "@/gigblade/BootScreen";

export class AppErrorBoundary extends Component<
	{ children: ReactNode },
	{ failed: boolean }
> {
	state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	render() {
		if (this.state.failed) {
			return <BootScreen message="No se pudo abrir el panel. Recargá la página." />;
		}
		return this.props.children;
	}
}
