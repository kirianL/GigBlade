import "server-only";

import { z } from "zod";

function optional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

const sharedEnvSchema = z.object({
  APP_RUNTIME: z.enum(["memory", "real"]).default("memory"),
  PLATFORM_VERCEL_TOKEN: z.string().optional(),
  PLATFORM_VERCEL_PROJECT_ID: z.string().optional(),
  PLATFORM_VERCEL_TEAM_ID: z.string().optional(),
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
    NEXT_PUBLIC_SUPABASE_URL: optional(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: optional(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    SUPABASE_SERVICE_ROLE_KEY: optional(process.env.SUPABASE_SERVICE_ROLE_KEY),
    PLATFORM_VERCEL_TOKEN: optional(process.env.PLATFORM_VERCEL_TOKEN),
    PLATFORM_VERCEL_PROJECT_ID: optional(
      process.env.PLATFORM_VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_ID,
    ),
    PLATFORM_VERCEL_TEAM_ID: optional(
      process.env.PLATFORM_VERCEL_TEAM_ID || process.env.VERCEL_ORG_ID,
    ),
    EDGE_CONFIG: optional(process.env.EDGE_CONFIG),
    EDGE_CONFIG_ID: optional(process.env.EDGE_CONFIG_ID),
    CLOUDFLARE_API_TOKEN: optional(process.env.CLOUDFLARE_API_TOKEN),
    CLOUDFLARE_ACCOUNT_ID: optional(process.env.CLOUDFLARE_ACCOUNT_ID),
    TURNSTILE_SECRET_KEY: optional(process.env.TURNSTILE_SECRET_KEY),
    TENANT_DEV_ID: optional(process.env.TENANT_DEV_ID),
    TENANT_DEV_HOSTNAME: optional(process.env.TENANT_DEV_HOSTNAME),
  };
}

export function getServerEnv() {
  if (process.env.APP_RUNTIME === "real") {
    return realEnvSchema.parse(envInput());
  }

  return memoryEnvSchema.parse(envInput());
}
