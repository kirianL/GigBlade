import { validationError } from "@/domain/errors";
import type { CommissionPercentages, PackagePrices } from "@/domain/referral";
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
      "Solo la plataforma puede consultar la configuración de comisiones.",
    );

    const settings = await getApp().getReferralSettings();
    return jsonWithTenantCors(request, { settings }, { requestId });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}

export async function PUT(request: Request) {
  const requestId = createRequestId();

  try {
    const actor = await requirePlatformActor(
      request,
      "Solo la plataforma puede modificar las tarifas y porcentajes.",
    );

    const body = (await readJsonBody(request)) as {
      currency?: string;
      exchangeRateCrc?: number;
      initialSetupPriceUsd?: number;
      initialSetupPercent?: number;
      monthlyPriceUsd?: number;
      monthlyPercent?: number;
      developerPercent?: number;
      founderPercent?: number;
      maintenanceMonthlyCostUsd?: number;
      maintenancePercent?: number;
      model?: "percentage" | "fixed";
      percentages?: CommissionPercentages;
      packagePrices?: PackagePrices;
    };

    if (!body) {
      throw validationError("Faltan los datos de configuración.");
    }

    const current = await getApp().getReferralSettings();

    const updated = await getApp().updateReferralSettings({
      currency: body.currency || current.currency || "USD",
      exchangeRateCrc: typeof body.exchangeRateCrc === "number" ? body.exchangeRateCrc : current.exchangeRateCrc,
      initialSetupPriceUsd: typeof body.initialSetupPriceUsd === "number" ? body.initialSetupPriceUsd : current.initialSetupPriceUsd,
      initialSetupPercent: typeof body.initialSetupPercent === "number" ? body.initialSetupPercent : current.initialSetupPercent,
      monthlyPriceUsd: typeof body.monthlyPriceUsd === "number" ? body.monthlyPriceUsd : current.monthlyPriceUsd,
      monthlyPercent: typeof body.monthlyPercent === "number" ? body.monthlyPercent : current.monthlyPercent,
      developerPercent: typeof body.developerPercent === "number" ? body.developerPercent : (current.developerPercent ?? 50),
      founderPercent: typeof body.founderPercent === "number" ? body.founderPercent : (current.founderPercent ?? 50),
      maintenanceMonthlyCostUsd: typeof body.maintenanceMonthlyCostUsd === "number" ? body.maintenanceMonthlyCostUsd : (current.maintenanceMonthlyCostUsd ?? 0),
      maintenancePercent: typeof body.maintenancePercent === "number" ? body.maintenancePercent : (current.maintenancePercent ?? 0),
      model: body.model || current.model || "percentage",
      percentages: body.percentages || current.percentages,
      packagePrices: body.packagePrices || current.packagePrices,
      updatedBy: actor.email,
    });

    return jsonWithTenantCors(request, { settings: updated }, { requestId });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}
