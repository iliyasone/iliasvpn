import { NextResponse } from "next/server";
import { HUB_KEY_COOKIE } from "@/lib/hub";

export const runtime = "nodejs";

/** Forget the key of this browser (plus cookies of the old invite and admin logins). */
export async function POST(request: Request) {
  const res = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  for (const name of [HUB_KEY_COOKIE, "access", "admin"]) {
    res.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return res;
}
