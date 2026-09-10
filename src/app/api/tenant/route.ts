import { getApp } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import { createRequestId } from "@/lib/http/request-id";
import { getTenantContext } from "@/lib/tenant/from-headers";

export async function GET() {
  const requestId = createRequestId();

  try {
    const context = await getTenantContext();
    const tenant = await getApp().getPublicTenant(context);

    return Response.json(tenant, {
      headers: { "x-request-id": requestId },
    });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
