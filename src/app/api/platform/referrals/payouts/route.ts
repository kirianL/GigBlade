import { unauthorized, validationError } from "@/domain/errors";
import type { PaymentMethod } from "@/domain/referral";
import { getApp } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import { readBearerToken, readJsonBody } from "@/lib/http/panel-request";
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
    const actor = await getApp().readPanelSession(readBearerToken(request));
    if (actor.role !== "platform") {
      throw unauthorized("Solo la plataforma puede ver las liquidaciones.");
    }

    const url = new URL(request.url);
    const affiliateId = url.searchParams.get("affiliateId") || undefined;
    const payouts = await getApp().listReferralPayouts(affiliateId);

    return jsonWithTenantCors(request, { payouts }, { requestId });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    const actor = await getApp().readPanelSession(readBearerToken(request));
    if (actor.role !== "platform") {
      throw unauthorized("Solo la plataforma puede registrar pagos a afiliados.");
    }

    const body = (await readJsonBody(request)) as {
      affiliateId?: string;
      amount?: number;
      currency?: string;
      method?: PaymentMethod;
      referenceNumber?: string;
      note?: string;
      conversionIds?: string[];
    };

    if (!body.affiliateId) throw validationError("Falta el afiliado.");
    if (!body.amount || body.amount <= 0) {
      throw validationError("El monto debe ser mayor a cero.");
    }
    if (!body.referenceNumber?.trim()) {
      throw validationError("Ingresá el número de comprobante o referencia (ej. SINPE).");
    }

    const payout = await getApp().recordReferralPayout({
      affiliateId: body.affiliateId,
      amount: Number(body.amount),
      currency: body.currency || "CRC",
      method: body.method === "iban" ? "iban" : "sinpe",
      referenceNumber: body.referenceNumber.trim(),
      note: body.note?.trim() || null,
      conversionIds: body.conversionIds,
      createdBy: actor.email,
    });

    return jsonWithTenantCors(request, { payout }, { requestId, status: 201 });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}
