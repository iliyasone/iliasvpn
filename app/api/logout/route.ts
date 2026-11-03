import { NextResponse } from "next/server";
import { ACCESS_COOKIE, ADMIN_COOKIE } from "@/lib/access";

export const runtime = "nodejs";

/** Forget who this browser is: invite, admin and Claude Code key cookies. */
export async function POST(request: Request) {
  const res = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  for (const name of [ACCESS_COOKIE, ADMIN_COOKIE, "hubkey"]) {
    res.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return res;
}
