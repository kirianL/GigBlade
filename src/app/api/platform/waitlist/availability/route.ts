import { validationError } from "@/domain/errors";
import { normalizeMeetingAvailability } from "@/domain/meeting-availability";
import { getApp } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import { readJsonBody, requirePlatformActor } from "@/lib/http/panel-request";
import { createRequestId } from "@/lib/http/request-id";
import {
	jsonWithTenantCors,
	tenantApiPreflight,
	withTenantCors,
} from "@/lib/http/tenant-api-cors";

export function OPTIONS(request: Request) {
	return tenantApiPreflight(request);
}

export async function GET(request: Request) {
	const requestId = createRequestId();

	try {
		await requirePlatformActor(
			request,
			"Solo la plataforma puede consultar la disponibilidad.",
		);
		const settings = await getApp().getReferralSettings();
		const availability = normalizeMeetingAvailability(
			(settings.packagePrices as Record<string, unknown> | undefined)
				?.meetingAvailability,
		);
		return jsonWithTenantCors(request, { availability }, { requestId });
	} catch (error) {
		return withTenantCors(request, errorResponse(error, requestId));
	}
}

export async function PUT(request: Request) {
	const requestId = createRequestId();

	try {
		const actor = await requirePlatformActor(
			request,
			"Solo la plataforma puede actualizar la disponibilidad.",
		);

		const body = await readJsonBody(request);
		if (!body || typeof body !== "object") {
			throw validationError("Faltan los datos de disponibilidad.");
		}

		const availability = normalizeMeetingAvailability(body);
		const current = await getApp().getReferralSettings();

		await getApp().updateReferralSettings({
			currency: current.currency || "USD",
			exchangeRateCrc: current.exchangeRateCrc,
			initialSetupPriceUsd: current.initialSetupPriceUsd,
			initialSetupPercent: current.initialSetupPercent,
			monthlyPriceUsd: current.monthlyPriceUsd,
			monthlyPercent: current.monthlyPercent,
			developerPercent: current.developerPercent ?? 50,
			founderPercent: current.founderPercent ?? 50,
			maintenanceMonthlyCostUsd: current.maintenanceMonthlyCostUsd ?? 0,
			maintenancePercent: current.maintenancePercent ?? 0,
			model: current.model || "percentage",
			percentages: current.percentages,
			packagePrices: {
				...current.packagePrices,
				meetingAvailability: availability as unknown as never,
			},
			updatedBy: actor.email,
		});

		return jsonWithTenantCors(request, { availability }, { requestId });
	} catch (error) {
		return withTenantCors(request, errorResponse(error, requestId));
	}
}
