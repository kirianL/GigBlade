import { forbidden, notFound, unauthorized } from "@/domain/errors";
import type { TenantContext } from "@/domain/tenant";
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
    const url = new URL(request.url);
    const requestedSlug = url.searchParams.get("slug")?.trim().toLowerCase();

    let targetSlug: string;
    if (actor.role === "dj") {
      if (!actor.slug) {
        throw forbidden("Tu cuenta de DJ no tiene un sitio asociado.");
      }
      if (requestedSlug && requestedSlug !== actor.slug) {
        throw forbidden("No podés ver contrataciones de otro DJ.");
      }
      targetSlug = actor.slug;
    } else {
      targetSlug = requestedSlug || "nox";
    }

    const tenants = await getApp().tenants.list();
    const tenant = tenants.find((t) => t.slug === targetSlug);
    if (!tenant) {
      throw notFound("DJ no encontrado.");
    }

    const context: TenantContext = {
      tenantId: tenant.id,
      hostname: `${tenant.slug}.localhost`,
      canonicalHostname: `${tenant.slug}.localhost`,
    };

    const bookings = await getApp().listTenantBookings(context);

    return jsonWithTenantCors(
      request,
      { bookings, slug: targetSlug },
      { requestId },
    );
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}

export async function PATCH(request: Request) {
  const requestId = createRequestId();

  try {
    const actor = await getApp().readPanelSession(readBearerToken(request));
    const body = (await readJsonBody(request)) as {
      id?: string;
      status?: string;
      slug?: string;
    };

    if (!body?.id) {
      throw notFound("ID de contratación ausente.");
    }

    let targetSlug: string;
    if (actor.role === "dj") {
      if (!actor.slug) {
        throw forbidden("Tu cuenta de DJ no tiene un sitio asociado.");
      }
      if (body.slug && body.slug !== actor.slug) {
        throw forbidden("No podés modificar contrataciones de otro DJ.");
      }
      targetSlug = actor.slug;
    } else {
      targetSlug = body.slug || "nox";
    }

    const tenants = await getApp().tenants.list();
    const tenant = tenants.find((t) => t.slug === targetSlug);
    if (!tenant) {
      throw notFound("DJ no encontrado.");
    }

    const context: TenantContext = {
      tenantId: tenant.id,
      hostname: `${tenant.slug}.localhost`,
      canonicalHostname: `${tenant.slug}.localhost`,
    };

    const updated = await getApp().updateBookingStatus(
      context,
      body.id,
      { status: body.status },
    );

    return jsonWithTenantCors(
      request,
      { booking: updated },
      { requestId },
    );
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}
