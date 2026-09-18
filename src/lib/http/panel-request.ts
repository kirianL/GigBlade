import { unauthorized } from "@/domain/errors";

export function readBearerToken(request: Request): string {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) {
    throw unauthorized();
  }
  const token = header.slice(7).trim();
  if (!token) throw unauthorized();
  return token;
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
