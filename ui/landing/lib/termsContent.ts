export type LegalSection = {
	title: string;
	content: string;
	isUppercase: boolean;
};

export const TERMS_EFFECTIVE_DATE = "September 10, 2026";

export const termsSections: LegalSection[] = [
	{
		title: "1. Acceptance of Terms",
		content:
			'By accessing or using GigBlade (the "Services"), you agree to these Terms of Service ("Terms"). If you do not agree, do not use the Services.',
		isUppercase: false,
	},
	{
		title: "2. Description of Services",
		content:
			"GigBlade provides hosted artist pages for DJs: a public site with a custom domain, templates for events, a booking form, and a panel to manage content and requests. Hosting and platform security are included in the subscription.",
		isUppercase: false,
	},
	{
		title: "3. Account Registration",
		content:
			"Some features require an account or a waitlist request. You agree to provide accurate information and to keep your credentials confidential. You are responsible for activity under your account.",
		isUppercase: false,
	},
	{
		title: "4. Acceptable Use",
		content:
			"You agree not to use the Services for any unlawful purpose; interfere with or disrupt the Services; attempt unauthorized access; transmit malicious code; or resell the Services without our prior written consent.",
		isUppercase: false,
	},
	{
		title: "5. Payment Terms",
		content:
			"Fees are listed on the pricing page. The monthly plan covers hosting, security, and the artist page. Domain renewal is billed at cost, without markup. Fees are non-refundable except as required by law. We may change pricing with 30 days' notice.",
		isUppercase: false,
	},
	{
		title: "6. Data and Privacy",
		content:
			'Your use of the Services is subject to our Privacy Policy. You retain ownership of content you submit. You grant us a limited license to host and display that content to provide the Services.',
		isUppercase: false,
	},
	{
		title: "7. Intellectual Property",
		content:
			"The platform, templates, and software are owned by GigBlade. We grant you a limited, non-exclusive license to use the Services. Your music, photos, and bio remain yours.",
		isUppercase: false,
	},
	{
		title: "8. Confidentiality",
		content:
			"Each party agrees to keep non-public information confidential and use it only to perform these Terms, except for information that is public, independently developed, or received from a third party.",
		isUppercase: false,
	},
	{
		title: "9. Warranties and Disclaimers",
		content:
			'THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE.',
		isUppercase: true,
	},
	{
		title: "10. Limitation of Liability",
		content:
			"TO THE MAXIMUM EXTENT PERMITTED BY LAW, GIGBLADE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNTS PAID BY YOU TO GIGBLADE IN THE TWELVE MONTHS PRECEDING THE CLAIM.",
		isUppercase: true,
	},
	{
		title: "11. Indemnification",
		content:
			"You agree to indemnify GigBlade and its team from claims arising from your content, your use of the Services, or your violation of these Terms.",
		isUppercase: false,
	},
	{
		title: "12. Term and Termination",
		content:
			"These Terms remain in effect until terminated. Either party may end the subscription with notice as described at signup. Upon termination we will coordinate an exit so your public presence is not cut off without warning. The domain is administered by GigBlade while you are on the service.",
		isUppercase: false,
	},
	{
		title: "13. Modifications",
		content:
			"We may modify these Terms by posting the revised version on the site. Material changes will be announced with at least 30 days' notice. Continued use after that date constitutes acceptance.",
		isUppercase: false,
	},
	{
		title: "14. Governing Law and Disputes",
		content:
			"These Terms are governed by the laws of Costa Rica, without regard to conflict of law principles, unless a mandatory consumer law in your country says otherwise.",
		isUppercase: false,
	},
	{
		title: "15. General Provisions",
		content:
			"These Terms are the entire agreement between you and GigBlade regarding the Services. If a provision is unenforceable, the rest remains in effect. Failure to enforce a right is not a waiver.",
		isUppercase: false,
	},
	{
		title: "16. Contact Information",
		content:
			"Questions about these Terms: hola@gigblade.com — GigBlade, Costa Rica.",
		isUppercase: false,
	},
];
