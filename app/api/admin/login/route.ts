import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminCookie } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const token = form?.get("token");
  const url = new URL("/admin", request.url);
  if (typeof token !== "string" || !isAdminCookie(token.trim())) {
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url, { status: 303 });
  }
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.set(ADMIN_COOKIE, token.trim(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

export async function DELETE(request: Request) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
