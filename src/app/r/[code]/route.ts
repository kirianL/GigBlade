import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const cleanCode = (code || "").trim().toUpperCase();
  const url = new URL(request.url);
  const target = new URL("/acceso", url.origin);
  if (cleanCode) {
    target.searchParams.set("ref", cleanCode);
  }

  const response = NextResponse.redirect(target);
  if (cleanCode) {
    response.cookies.set("gb_ref", cleanCode, {
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}
