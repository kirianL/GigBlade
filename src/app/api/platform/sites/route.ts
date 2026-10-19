import { paginatePlatformSites } from "@/application/sites/list-platform-sites";
import { getApp } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import {
  readJsonBody,
  requirePanelActor,
  requirePlatformActor,
} from "@/lib/http/panel-request";
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
  const startedAt = performance.now();

  try {
    await requirePlatformActor(request, "Solo la plataforma puede listar sitios.");

    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");
    const searchParam = url.searchParams.get("q") ?? undefined;

    const allSites = await getApp().listPlatformSites();
    const paged = paginatePlatformSites(allSites, {
      limit: limitParam ? Number(limitParam) : undefined,
      offset: offsetParam ? Number(offsetParam) : undefined,
      search: searchParam,
    });

    return jsonWithTenantCors(request, paged, {
      requestId,
      durationMs: performance.now() - startedAt,
    });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}

export async function DELETE(request: Request) {
  const requestId = createRequestId();

  try {
    const actor = await requirePanelActor(request);
    const slug = new URL(request.url).searchParams.get("slug");
    const deleted = await getApp().deleteDj(actor, { slug });
    return jsonWithTenantCors(request, deleted, { requestId });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    const actor = await requirePanelActor(request);
    const created = await getApp().createDj(actor, await readJsonBody(request));
    return jsonWithTenantCors(request, created, { requestId, status: 201 });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}
