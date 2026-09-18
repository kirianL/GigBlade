function trimmed(value: string | undefined): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

/** Nombres de Vercel + integración Supabase, además de los NEXT_PUBLIC_ del código. */
export function supabaseUrl() {
  return trimmed(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  );
}

export function supabaseAnonKey() {
  return trimmed(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY,
  );
}

export function supabaseServiceRoleKey() {
  return trimmed(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
  );
}

export function resolveAppRuntime(): "memory" | "real" {
  const explicit = trimmed(process.env.APP_RUNTIME);
  if (explicit === "real" || explicit === "memory") return explicit;
  if (process.env.VERCEL && supabaseUrl() && supabaseServiceRoleKey()) {
    return "real";
  }
  return "memory";
}
