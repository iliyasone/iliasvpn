import "server-only";
import { cookies, headers } from "next/headers";
import { notifyTelegram } from "./telegram";
import { touchInvite } from "./access-store";
import type { AccessEntry } from "./access";

const PING_EVERY_S = 10 * 60;

const PAGE_NAMES: Record<string, string> = {
  claude: "Claude",
  blancvpn: "BlancVPN",
};

function visitorLocation(h: Headers): { ip: string; place: string } {
  const ip =
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "?";
  const city = h.get("x-vercel-ip-city");
  const country = h.get("x-vercel-ip-country");
  const place = [city && decodeURIComponent(city), country]
    .filter(Boolean)
    .join(", ");
  return { ip, place };
}

/**
 * Called from the messages API on behalf of an authenticated visitor.
 * Notifies at most once per 10 minutes per page per browser; the throttle
 * lives in an httpOnly cookie the browser cannot forge.
 */
export async function recordVisit(
  invite: AccessEntry & { token: string },
  page: string,
): Promise<void> {
  const pageName = PAGE_NAMES[page];
  if (!pageName) return;

  const jar = await cookies();
  const key = `vp_${page}`;
  if (jar.get(key)) return;
  jar.set(key, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PING_EVERY_S,
  });

  const { ip, place } = visitorLocation(await headers());
  const from = [place, ip].filter(Boolean).join(" · ");
  const before = await touchInvite(invite.token, from);
  const first = !before?.firstSeenAt;

  const text = first
    ? `🆕 ${invite.name} — первый вход, страница ${pageName}\n${from}`
    : `👤 ${invite.name} открыл(а) ${pageName}\n${from}`;
  await notifyTelegram(text).catch((err) => console.error("[visit]", err));
}
