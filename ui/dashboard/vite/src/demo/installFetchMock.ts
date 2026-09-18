const AUTUMN_SDK_CUSTOMER = {
	id: "cus_demo",
	name: "GigBlade",
	email: "hola@gigblade.com",
	flags: {
		pkey: true,
		stripe_key: true,
		platform: false,
		vercel: false,
		revenuecat: false,
		sso: false,
	},
};

export function installFetchMock() {
	const originalFetch = window.fetch.bind(window);

	window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		const url =
			typeof input === "string"
				? input
				: input instanceof URL
					? input.href
					: input.url;

		const isAutumnSdk =
			url.includes("/api/autumn/") || url.includes("/api/auth/autumn/");
		const isAuth = url.includes("/api/auth/");
		const isBackend =
			url.includes("localhost:8080") || url.includes("127.0.0.1:8080");

		if (url.includes("/api/panel")) {
			return originalFetch(input, init);
		}

		if (isAutumnSdk || isAuth || isBackend) {
			return new Response(JSON.stringify({ customer: AUTUMN_SDK_CUSTOMER }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}

		return originalFetch(input, init);
	};
}
