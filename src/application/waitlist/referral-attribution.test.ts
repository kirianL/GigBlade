import { describe, expect, it } from "vitest";
import { loginPanel, readPanelSession } from "@/application/panel/login-panel";
import { joinWaitlist } from "@/application/waitlist/join-waitlist";
import { onboardWaitlistSignup } from "@/application/waitlist/onboard-waitlist";
import { InMemoryPanelAuthStore } from "@/infrastructure/memory/in-memory-panel-auth-store";
import { InMemoryReferralRepository } from "@/infrastructure/memory/in-memory-referral-repository";
import { InMemoryTenantRepository } from "@/infrastructure/memory/in-memory-tenant-repository";
import { InMemoryTenantRoutingStore } from "@/infrastructure/memory/in-memory-tenant-routing-store";
import { InMemoryWaitlistRepository } from "@/infrastructure/memory/in-memory-waitlist-repository";

describe("referral attribution in waitlist", () => {
	it("no genera comisión al llenar el formulario, sino hasta que se crea la página del DJ", async () => {
		const waitlist = new InMemoryWaitlistRepository();
		const referrals = new InMemoryReferralRepository({ seed: true });
		const tenants = new InMemoryTenantRepository();
		const routing = new InMemoryTenantRoutingStore();
		const panelAuth = new InMemoryPanelAuthStore(undefined, "clave-local");
		const session = await loginPanel(panelAuth, {
			email: "hola@gigblade.com",
			password: "clave-local",
		});
		const actor = await readPanelSession(panelAuth, session.token);

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

		// Al solo llenar el formulario NO debe existir conversión en el historial
		const beforeOnboard = await referrals.listConversions();
		expect(beforeOnboard.find((c) => c.djEmail === "luna@rave.cr")).toBeUndefined();

		// Ahora la plataforma le crea la página (cuando el DJ ya pagó y se afilia)
		const signup = (await waitlist.list())[0]!;
		expect(signup.referralCode).toBe("MAXX");

		await onboardWaitlistSignup(
			{
				waitlist,
				tenants,
				routing,
				panelAuth,
				referrals,
			},
			actor,
			{ id: signup.id },
		);

		// Verificar que la conversión quedó registrada para MAXX tras crear la página
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
		expect(lunaConv?.tenantId).toBeTruthy();

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
