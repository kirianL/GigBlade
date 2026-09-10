import "server-only";

import { getServerEnv } from "@/lib/env/server";

type EdgeConfigItem = {
  operation: "create" | "update" | "upsert" | "delete";
  key: string;
  value?: unknown;
};

export async function patchEdgeConfigItems(items: EdgeConfigItem[]) {
  const env = getServerEnv();

  if (!env.PLATFORM_VERCEL_TOKEN || !env.EDGE_CONFIG_ID) {
    throw new Error("Faltan PLATFORM_VERCEL_TOKEN o EDGE_CONFIG_ID");
  }

  const url = new URL(
    `https://api.vercel.com/v1/edge-config/${env.EDGE_CONFIG_ID}/items`,
  );

  if (env.PLATFORM_VERCEL_TEAM_ID) {
    url.searchParams.set("teamId", env.PLATFORM_VERCEL_TEAM_ID);
  }

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${env.PLATFORM_VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ items }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error("No se pudo actualizar Edge Config");
  }
}
