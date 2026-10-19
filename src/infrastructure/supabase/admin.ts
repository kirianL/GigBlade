import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env/server";

let adminClient: SupabaseClient | undefined;
let adminClientKey = "";

export function createSupabaseAdminClient(): SupabaseClient {
  const env = getServerEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase env is required when APP_RUNTIME=real");
  }

  const key = `${env.NEXT_PUBLIC_SUPABASE_URL}::${env.SUPABASE_SERVICE_ROLE_KEY}`;
  if (!adminClient || adminClientKey !== key) {
    adminClientKey = key;
    adminClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  return adminClient;
}
