import { NextResponse, type NextRequest } from "next/server";

const KEY_COOKIE = "hubkey";
const KEY_HEADER = "x-hub-key";
const KEY_MAX_AGE = 60 * 60 * 24 * 365;

async function keyIsLive(key: string): Promise<boolean> {
  const base = (process.env.HUB_URL || "").replace(/\/$/, "");
  if (!base) return false;
  const res = await fetch(`${base}/hub/me`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  }).catch(() => null);
  return Boolean(res?.ok);
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Old key links: /code?key=… → /claude?key=…
  if (pathname === "/code") {
    const url = request.nextUrl.clone();
    url.pathname = "/claude";
    return NextResponse.redirect(url);
  }

  // Personal link: any page with ?key=<key> signs this browser in. The page renders right
  // away from the URL (agents fetch without a cookie jar) and the key is kept in a cookie.
  const key = searchParams.get("key")?.trim();
  if (key === undefined) return NextResponse.next();
  if (!/^sk-hub-[0-9a-f]{48}$/.test(key) || !(await keyIsLive(key))) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("key");
    url.searchParams.set("bad", "1");
    return NextResponse.redirect(url);
  }
  const headers = new Headers(request.headers);
  headers.set(KEY_HEADER, key);
  const res = NextResponse.next({ request: { headers } });
  res.cookies.set(KEY_COOKIE, key, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: KEY_MAX_AGE,
  });
  return res;
}

export const config = {
  matcher: ["/", "/claude", "/gemini", "/blancvpn", "/code", "/admin"],
};
