import type { UpdateAffiliateInput } from "@/application/ports/referral-repository";
import { unauthorized } from "@/domain/errors";
import { assertAffiliateDraft } from "@/domain/referral";
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
      throw unauthorized("Solo la plataforma puede ver los referidos y afiliados.");
    }

    const [affiliates, conversions, settings, payouts] = await Promise.all([
      getApp().listAffiliates(),
      getApp().listReferralConversions(),
      getApp().getReferralSettings(),
      getApp().listReferralPayouts(),
    ]);

    return jsonWithTenantCors(
      request,
      { affiliates, conversions, settings, payouts },
      { requestId },
    );
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    const actor = await getApp().readPanelSession(readBearerToken(request));
    if (actor.role !== "platform") {
      throw unauthorized("Solo la plataforma puede registrar afiliados.");
    }

    const body = (await readJsonBody(request)) as Parameters<typeof assertAffiliateDraft>[0];
    const draft = assertAffiliateDraft(body);

    const created = await getApp().createAffiliate(draft);
    return jsonWithTenantCors(request, { affiliate: created }, { requestId, status: 201 });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}

export async function PATCH(request: Request) {
  const requestId = createRequestId();

  try {
    const actor = await getApp().readPanelSession(readBearerToken(request));
    if (actor.role !== "platform") {
      throw unauthorized("Solo la plataforma puede modificar afiliados.");
    }

    const body = (await readJsonBody(request)) as { id?: string } & Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      throw new Error("Falta el ID del afiliado.");
    }

    const updated = await getApp().updateAffiliate(id, body as UpdateAffiliateInput);
    return jsonWithTenantCors(request, { affiliate: updated }, { requestId });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}
