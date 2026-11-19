"use client";

import { Component, type ReactNode } from "react";

type Props = {
	pathname?: string;
	message?: string;
	children: ReactNode;
};

type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidUpdate(prevProps: Props) {
		if (this.state.hasError && prevProps.pathname !== this.props.pathname) {
			this.setState({ hasError: false });
		}
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="card mx-auto max-w-xl p-8 text-center">
					<h2 className="text-sm font-semibold text-grayscale-12">
						Ocurrió un error al cargar esta vista
					</h2>
					<p className="mt-1 text-[13px] text-grayscale-10">
						{this.props.message ?? "Recargá la página o probá otra sección."}
					</p>
					<button
						type="button"
						onClick={() => this.setState({ hasError: false })}
						className="mt-4 inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-grayscale-12 px-4 text-[12.5px] font-medium text-grayscale-1 transition-colors hover:bg-grayscale-11"
					>
						Reintentar
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}
