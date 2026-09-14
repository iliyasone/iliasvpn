import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_MAX_AGE,
  ACCESS_QUERY,
  isAdminCookie,
  resolveToken,
} from "@/lib/access";

const PROTECTED_API = ["/api/messages", "/api/message"];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

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
    if (!invite) {
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
  matcher: ["/", "/claude", "/blancvpn", "/admin", "/api/:path*"],
};
