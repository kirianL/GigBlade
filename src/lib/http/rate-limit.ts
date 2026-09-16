import { rateLimited } from "@/domain/errors";

const hits = new Map<string, number[]>();

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function requestHost(request: Request): string {
  return request.headers.get("host") ?? "unknown";
}

export function assertCombinedRateLimit({
  ip,
  host,
  userId,
  limit,
  windowMs,
}: {
  ip: string;
  host: string;
  userId?: string;
  limit: number;
  windowMs: number;
}) {
  const key = [host, ip, userId ?? "-"].join(":");
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < windowMs);

  if (recent.length >= limit) {
    throw rateLimited(Math.ceil((windowMs - (now - recent[0])) / 1000));
  }

  recent.push(now);
  hits.set(key, recent);
}
