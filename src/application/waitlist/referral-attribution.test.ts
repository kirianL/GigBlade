import { describe, expect, it } from "vitest";
import { joinWaitlist } from "@/application/waitlist/join-waitlist";
import { InMemoryReferralRepository } from "@/infrastructure/memory/in-memory-referral-repository";
import { InMemoryWaitlistRepository } from "@/infrastructure/memory/in-memory-waitlist-repository";

describe("referral attribution in waitlist", () => {
	it("atribuye la conversión automáticamente al afiliado cuando viene el código", async () => {
		const waitlist = new InMemoryWaitlistRepository();
		const referrals = new InMemoryReferralRepository({ seed: true });

		// Afiliado 'MAXX' existe en el seed
		const result = await joinWaitlist(
			waitlist,
			{
				artistName: "DJ Luna",
				email: "luna@rave.cr",
				phone: "+506 8999 1234",
				city: "San José",
				referralCode: "MAXX",
			},
			referrals,
		);

		expect(result).toEqual({ alreadyJoined: false });

		// Verificar que la conversión quedó registrada para MAXX (Cobro inicial)
		const conversions = await referrals.listConversions();
		const lunaConv = conversions.find((c) => c.djEmail === "luna@rave.cr");

		expect(lunaConv).toBeDefined();
		expect(lunaConv?.affiliateCode).toBe("MAXX");
		expect(lunaConv?.djName).toBe("DJ Luna");
		expect(lunaConv?.chargeType).toBe("initial_setup");
		expect(lunaConv?.commissionPercentage).toBe(20);
		expect(lunaConv?.commissionAmountUsd).toBe(20); // 20% de $100
		expect(lunaConv?.commissionAmountCrc).toBe(10300); // 20 * 515
		expect(lunaConv?.payoutStatus).toBe("unpaid");

		// Comprobar balance del afiliado MAXX
		const affiliates = await referrals.listAffiliates();
		const maxx = affiliates.find((a) => a.code === "MAXX");
		expect(maxx).toBeDefined();
		expect(maxx?.pendingBalanceCrc).toBeGreaterThan(0);
	});

	it("liquida comisiones registrando comprobante SINPE y descuenta el saldo pendiente", async () => {
		const referrals = new InMemoryReferralRepository({ seed: true });
		const affiliates = await referrals.listAffiliates();
		const maxx = affiliates.find((a) => a.code === "MAXX")!;
		const initialPendingCrc = maxx.pendingBalanceCrc;

		expect(initialPendingCrc).toBeGreaterThan(0);

		const payout = await referrals.recordPayout({
			affiliateId: maxx.id,
			amount: 5000,
			currency: "CRC",
			method: "sinpe",
			referenceNumber: "SINPE-998822",
			note: "Pago quincenal de prueba",
		});

		expect(payout.referenceNumber).toBe("SINPE-998822");
		expect(payout.amount).toBe(5000);

		// Revisar que el saldo pendiente se redujo en los 5000 colones
		const updatedAffiliates = await referrals.listAffiliates();
		const maxxUpdated = updatedAffiliates.find((a) => a.code === "MAXX")!;
		expect(maxxUpdated.pendingBalanceCrc).toBe(initialPendingCrc - 5000);
	});
});
