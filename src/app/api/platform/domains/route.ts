import { unauthorized, validationError } from "@/domain/errors";
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

  try {
    await requirePlatformActor(
      request,
      "Solo la plataforma puede listar dominios.",
    );

    const domains = await getApp().listPlatformDomains();
    return jsonWithTenantCors(request, { domains }, { requestId });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    const actor = await requirePanelActor(request);
    const body = (await readJsonBody(request)) as { slug?: unknown; domain?: unknown };
    if (typeof body.slug !== "string" || !body.slug.trim()) {
      throw validationError("Slug de DJ requerido");
    }

    if (actor.role === "dj") {
      if (actor.slug !== body.slug.trim()) {
        throw unauthorized("Solo puedes asignar un dominio a tu propia página.");
      }
    } else if (actor.role !== "platform") {
      throw unauthorized("No autorizado para asignar dominios.");
    }

    const domain = await getApp().assignPlatformDomain(body);
    return jsonWithTenantCors(request, { domain }, { requestId, status: 201 });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}

export async function DELETE(request: Request) {
  const requestId = createRequestId();

  try {
    const actor = await requirePanelActor(request);
    const body = (await readJsonBody(request)) as { domain?: unknown; slug?: unknown };
    if (typeof body.domain !== "string" || !body.domain.trim()) {
      throw validationError("Dominio requerido para desconectar");
    }

    const domain = body.domain.trim();
    const slug =
      actor.role === "dj"
        ? actor.slug
        : typeof body.slug === "string" && body.slug.trim()
        ? body.slug.trim()
        : undefined;

    const result = await getApp().removePlatformDomain(domain, slug);
    return jsonWithTenantCors(request, result, { requestId });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}
