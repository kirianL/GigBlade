import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { unauthorized, validationError } from "@/domain/errors";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { getApp, getRuntime } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import { readBearerToken } from "@/lib/http/panel-request";
import { createRequestId } from "@/lib/http/request-id";
import {
  jsonWithTenantCors,
  tenantApiPreflight,
  withTenantCors,
} from "@/lib/http/tenant-api-cors";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIME_EXTENSIONS = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

export function OPTIONS(request: Request) {
  return tenantApiPreflight(request);
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    const actor = await getApp().readPanelSession(readBearerToken(request));
    const formData = await request.formData();
    const file = formData.get("file");
    const slug = String(formData.get("slug") ?? "").trim().toLowerCase();

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw validationError("El DJ no es válido.");
    }
    if (actor.role !== "platform" && actor.slug !== slug) {
      throw unauthorized("No podés editar las fotos de este DJ.");
    }
    if (!(file instanceof File)) {
      throw validationError("Seleccioná una imagen.");
    }
    const extension = MIME_EXTENSIONS.get(file.type);
    if (!extension) {
      throw validationError("Usá una imagen JPG, PNG, WebP o AVIF.");
    }
    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      throw validationError("La imagen debe pesar menos de 5 MB.");
    }

    const objectPath = `sites/${slug}/${randomUUID()}.${extension}`;
    let url: string;

    if (getRuntime() === "real") {
      const supabase = createSupabaseAdminClient();
      const bucket = "site-images";
      const { error: bucketError } = await supabase.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes: [...MIME_EXTENSIONS.keys()],
        fileSizeLimit: MAX_IMAGE_BYTES,
      });
      if (bucketError && !/already exists/i.test(bucketError.message)) {
        throw bucketError;
      }
      const { error } = await supabase.storage
        .from(bucket)
        .upload(objectPath, await file.arrayBuffer(), {
          contentType: file.type,
          cacheControl: "31536000",
          upsert: false,
        });
      if (error) throw error;
      url = supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
    } else {
      const outputPath = join(process.cwd(), "public", ...objectPath.split("/"));
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, Buffer.from(await file.arrayBuffer()));
      url = `/${objectPath}`;
    }

    return jsonWithTenantCors(request, { url }, { requestId });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}
