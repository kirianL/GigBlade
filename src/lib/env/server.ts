import "server-only";

import { z } from "zod";

const sharedEnvSchema = z.object({
  APP_RUNTIME: z.enum(["memory", "real"]).default("memory"),
  VERCEL_API_TOKEN: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().optional(),
  VERCEL_TEAM_ID: z.string().optional(),
  EDGE_CONFIG: z.string().optional(),
  EDGE_CONFIG_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  TENANT_DEV_ID: z.uuid().optional(),
  TENANT_DEV_HOSTNAME: z.string().optional(),
});

const realEnvSchema = sharedEnvSchema.extend({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const memoryEnvSchema = sharedEnvSchema.extend({
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

function envInput() {
  return {
    APP_RUNTIME: process.env.APP_RUNTIME || "memory",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined,
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
    VERCEL_API_TOKEN: process.env.VERCEL_API_TOKEN,
    VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID,
    VERCEL_TEAM_ID: process.env.VERCEL_TEAM_ID,
    EDGE_CONFIG: process.env.EDGE_CONFIG,
    EDGE_CONFIG_ID: process.env.EDGE_CONFIG_ID,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    TENANT_DEV_ID: process.env.TENANT_DEV_ID || undefined,
    TENANT_DEV_HOSTNAME: process.env.TENANT_DEV_HOSTNAME || undefined,
  };
}

export function getServerEnv() {
  if (process.env.APP_RUNTIME === "real") {
    return realEnvSchema.parse(envInput());
  }

  return memoryEnvSchema.parse(envInput());
}
