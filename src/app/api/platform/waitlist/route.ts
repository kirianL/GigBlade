import { unauthorized } from "@/domain/errors";
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
      throw unauthorized("Solo la plataforma puede ver la lista de espera.");
    }

    const signups = await getApp().listWaitlist();
    return jsonWithTenantCors(request, { signups }, { requestId });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    const actor = await getApp().readPanelSession(readBearerToken(request));
    const body = (await readJsonBody(request)) as { id?: unknown };
    const created = await getApp().onboardWaitlist(actor, { id: body.id });
    return jsonWithTenantCors(request, created, { requestId, status: 201 });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}

export async function DELETE(request: Request) {
  const requestId = createRequestId();

  try {
    const actor = await getApp().readPanelSession(readBearerToken(request));
    const id = new URL(request.url).searchParams.get("id");
    const removed = await getApp().removeWaitlist(actor, { id });
    return jsonWithTenantCors(request, removed, { requestId });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}
