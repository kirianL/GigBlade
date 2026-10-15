import { describe, expect, it } from "vitest";
import {
	assertAffiliateDraft,
	buildReferralLink,
	calculateCommission,
	calculateRevenueSplit,
	normalizeAffiliateCode,
	type ReferralCommissionSettings,
} from "@/domain/referral";

describe("referral domain", () => {
	it("normaliza y valida códigos de afiliados en mayúsculas", () => {
		expect(normalizeAffiliateCode("  maxx  ")).toBe("MAXX");
		expect(normalizeAffiliateCode("promo_2026")).toBe("PROMO_2026");
		expect(() => normalizeAffiliateCode("")).toThrow();
		expect(() => normalizeAffiliateCode("a")).toThrow();
		expect(() => normalizeAffiliateCode("inválido con espacios")).toThrow();
	});

	it("genera enlaces directos de afiliado", () => {
		expect(buildReferralLink("MAXX")).toBe("https://gigblades.vercel.app/acceso?ref=MAXX");
		expect(buildReferralLink("FAMA", "http://localhost:3000")).toBe(
			"http://localhost:3000/acceso?ref=FAMA",
		);
	});

	it("valida el borrador de un afiliado que no es DJ", () => {
		const draft = assertAffiliateDraft({
			name: "Carlos Promotor",
			code: "carlos_dj",
			email: "carlos@promotor.com",
			phone: "+506 8888 1234",
			paymentMethod: "sinpe",
			sinpePhone: "88881234",
		});

		expect(draft.code).toBe("CARLOS_DJ");
		expect(draft.email).toBe("carlos@promotor.com");
		expect(draft.paymentMethod).toBe("sinpe");
		expect(draft.paymentDetails.sinpePhone).toBe("88881234");
	});

	it("calcula comisión por cobro inicial de página y mensualidad de $30 en USD y Colones", () => {
		const settings: ReferralCommissionSettings = {
			currency: "USD",
			exchangeRateCrc: 515,
			initialSetupPriceUsd: 100, // $100 cobro inicial
			initialSetupPercent: 20, // 20% = $20 USD
			monthlyPriceUsd: 30, // $30 mensualidad
			monthlyPercent: 15, // 15% = $4.50 USD
			percentages: {
				initial_setup: 20,
				monthly: 15,
			},
			packagePrices: {
				initial_setup: 100,
				monthly: 30,
			},
			isActive: true,
			updatedAt: new Date().toISOString(),
		};

		// 1. Cobro inicial de la página:
		const initialCalc = calculateCommission({ chargeType: "initial_setup", settings });
		expect(initialCalc.chargeType).toBe("initial_setup");
		expect(initialCalc.amountUsd).toBe(100);
		expect(initialCalc.commissionPercentage).toBe(20);
		expect(initialCalc.commissionAmountUsd).toBe(20);
		expect(initialCalc.commissionAmountCrc).toBe(10300); // 20 * 515

		// 2. Mensualidad recurrente de $30:
		const monthlyCalc = calculateCommission({ chargeType: "monthly", settings });
		expect(monthlyCalc.chargeType).toBe("monthly");
		expect(monthlyCalc.amountUsd).toBe(30);
		expect(monthlyCalc.commissionPercentage).toBe(15);
		expect(monthlyCalc.commissionAmountUsd).toBe(4.5);
		expect(monthlyCalc.commissionAmountCrc).toBe(2318); // 4.5 * 515 = 2317.5 -> 2318
	});

	it("respeta porcentajes personalizados cuando el afiliado tiene trato especial", () => {
		const settings: ReferralCommissionSettings = {
			currency: "USD",
			exchangeRateCrc: 515,
			initialSetupPriceUsd: 100,
			initialSetupPercent: 20,
			monthlyPriceUsd: 30,
			monthlyPercent: 15,
			percentages: { initial_setup: 20, monthly: 15 },
			packagePrices: { initial_setup: 100, monthly: 30 },
			isActive: true,
			updatedAt: new Date().toISOString(),
		};

		const affiliateVip = {
			id: "aff_vip",
			code: "SUPERMAXX",
			name: "Maxx VIP",
			email: "vip@gigblade.cr",
			phone: null,
			paymentMethod: "sinpe" as const,
			paymentDetails: {},
			customPercentageEnabled: true,
			customPercentages: {
				initial_setup: 35, // Afiliado VIP gana 35% del cobro inicial
				monthly: 25, // Afiliado VIP gana 25% de la mensualidad
			},
			status: "active" as const,
			createdAt: "",
			updatedAt: "",
		};

		const vipInitial = calculateCommission({
			chargeType: "initial_setup",
			settings,
			affiliate: affiliateVip,
		});

		expect(vipInitial.commissionPercentage).toBe(35);
		expect(vipInitial.commissionAmountUsd).toBe(35); // 35% de $100 = $35
		expect(vipInitial.commissionAmountCrc).toBe(18025); // 35 * 515 = 18025
	});

	it("calcula la distribución financiera neta entre desarrollador y socio fundador (Plan Hobby = $0)", () => {
		const settings: ReferralCommissionSettings = {
			currency: "USD",
			exchangeRateCrc: 515,
			initialSetupPriceUsd: 100,
			initialSetupPercent: 20,
			monthlyPriceUsd: 30,
			monthlyPercent: 15,
			developerPercent: 50,
			founderPercent: 50,
			maintenanceMonthlyCostUsd: 0, // Plan Hobby
			maintenancePercent: 0,
			percentages: { initial_setup: 20, monthly: 15 },
			packagePrices: { initial_setup: 100, monthly: 30 },
			isActive: true,
			updatedAt: new Date().toISOString(),
		};

		// Caso A: Cobro inicial ($100) con enlace de referido (20% al promotor)
		const splitSetupWithRef = calculateRevenueSplit({
			chargeType: "initial_setup",
			hasReferral: true,
			settings,
		});

		expect(splitSetupWithRef.grossAmountUsd).toBe(100);
		expect(splitSetupWithRef.referralPercent).toBe(20);
		expect(splitSetupWithRef.referralAmountUsd).toBe(20);
		expect(splitSetupWithRef.maintenanceCostUsd).toBe(0); // Plan Hobby $0
		expect(splitSetupWithRef.netDistributableUsd).toBe(80);
		expect(splitSetupWithRef.developerPercent).toBe(50);
		expect(splitSetupWithRef.developerAmountUsd).toBe(40);
		expect(splitSetupWithRef.founderPercent).toBe(50);
		expect(splitSetupWithRef.founderAmountUsd).toBe(40);

		// Caso B: Mensualidad ($30) con enlace de referido (15% al promotor)
		const splitMonthlyWithRef = calculateRevenueSplit({
			chargeType: "monthly",
			hasReferral: true,
			settings,
		});

		expect(splitMonthlyWithRef.grossAmountUsd).toBe(30);
		expect(splitMonthlyWithRef.referralPercent).toBe(15);
		expect(splitMonthlyWithRef.referralAmountUsd).toBe(4.5);
		expect(splitMonthlyWithRef.maintenanceCostUsd).toBe(0);
		expect(splitMonthlyWithRef.netDistributableUsd).toBe(25.5);
		expect(splitMonthlyWithRef.developerAmountUsd).toBe(12.75);
		expect(splitMonthlyWithRef.founderAmountUsd).toBe(12.75);

		// Caso C: DJ directo sin referido (100% margen neto para el equipo)
		const splitDirect = calculateRevenueSplit({
			chargeType: "initial_setup",
			hasReferral: false,
			settings,
		});

		expect(splitDirect.referralAmountUsd).toBe(0);
		expect(splitDirect.netDistributableUsd).toBe(100);
		expect(splitDirect.developerAmountUsd).toBe(50);
		expect(splitDirect.founderAmountUsd).toBe(50);
	});
});
