import { Component, type ReactNode } from "react";

export class AppErrorBoundary extends Component<
	{ children: ReactNode; pathname?: string; message?: string },
	{ failed: boolean }
> {
	state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	componentDidUpdate(prevProps: { pathname?: string }) {
		if (
			this.state.failed &&
			prevProps.pathname !== undefined &&
			prevProps.pathname !== this.props.pathname
		) {
			this.setState({ failed: false });
		}
	}

	render() {
		if (this.state.failed) {
			return (
				<p role="alert" className="p-6 text-sm text-destructive">
					{this.props.message ??
						"No se pudo abrir el panel. Recargá la página."}
				</p>
			);
		}
		return this.props.children;
	}
}
