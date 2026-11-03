import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_MAX_AGE,
  ACCESS_QUERY,
  isAdminCookie,
  resolveToken,
} from "@/lib/access";

const HUB_KEY_COOKIE = "hubkey";
const HUB_KEY_HEADER = "x-hub-key";

async function hubKeyIsLive(key: string): Promise<boolean> {
  const base = (process.env.HUB_URL || "").replace(/\/$/, "");
  if (!base) return false;
  const res = await fetch(`${base}/hub/me`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  }).catch(() => null);
  return Boolean(res?.ok);
}

const PROTECTED_API = ["/api/messages", "/api/message"];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Old key links: /code?key=… → /claude?key=…
  if (pathname === "/code") {
    const url = request.nextUrl.clone();
    url.pathname = "/claude";
    return NextResponse.redirect(url);
  }

  // Claude Code key link: /claude?key=<hub key> → render the agent page right away
  // (agents fetch it without a cookie jar) and remember the key in a cookie.
  const hubKey = pathname === "/claude" ? searchParams.get("key")?.trim() : undefined;
  if (hubKey !== undefined) {
    const valid = /^sk-hub-[0-9a-f]{48}$/.test(hubKey) && (await hubKeyIsLive(hubKey));
    if (!valid) {
      const url = request.nextUrl.clone();
      url.searchParams.delete("key");
      url.searchParams.set("bad", "1");
      return NextResponse.redirect(url);
    }
    const headers = new Headers(request.headers);
    headers.set(HUB_KEY_HEADER, hubKey);
    const res = NextResponse.next({ request: { headers } });
    res.cookies.set(HUB_KEY_COOKIE, hubKey, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: ACCESS_COOKIE_MAX_AGE,
    });
    return res;
  }

  // Invite link: /?k=<token> → set the cookie and drop the token from the URL.
  const candidate = searchParams.get(ACCESS_QUERY);
  if (candidate !== null) {
    const invite = await resolveToken(candidate);
    const url = request.nextUrl.clone();
    url.searchParams.delete(ACCESS_QUERY);
    const res = NextResponse.redirect(url);
    if (invite) {
      res.cookies.set(ACCESS_COOKIE, candidate, {
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: ACCESS_COOKIE_MAX_AGE,
      });
    }
    return res;
  }

  if (PROTECTED_API.some((p) => pathname.startsWith(p))) {
    const invite = await resolveToken(request.cookies.get(ACCESS_COOKIE)?.value);
    if (!invite && !isAdminCookie(request.cookies.get("admin")?.value)) {
      return NextResponse.json(
        { error: "Нет доступа.", code: "NO_ACCESS" },
        { status: 401 },
      );
    }
  }

  if (pathname.startsWith("/api/admin/tokens")) {
    if (!isAdminCookie(request.cookies.get("admin")?.value)) {
      return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/claude", "/blancvpn", "/code", "/admin", "/api/:path*"],
};
