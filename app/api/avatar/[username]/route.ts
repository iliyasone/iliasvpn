import { NextResponse } from "next/server";
import { TELEGRAM_RE, readTokens } from "@/lib/access";
import { ADMIN_TELEGRAM } from "@/lib/session";
import { isHubTelegram } from "@/lib/hub";
import { telegramProfile } from "@/lib/telegram-profile";

export const runtime = "nodejs";

/** Telegram avatar of the admin, an invited person or a Claude Code key, served from this site. */
export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const known =
    username === ADMIN_TELEGRAM ||
    Object.values(await readTokens()).some((e) => e.telegram === username) ||
    (TELEGRAM_RE.test(username) && (await isHubTelegram(username)));
  if (!TELEGRAM_RE.test(username) || !known) {
    return new NextResponse(null, { status: 404 });
  }
  const { photo } = await telegramProfile(username);
  const img = photo ? await fetch(photo, { next: { revalidate: 6 * 3600 } }).catch(() => null) : null;
  if (!img?.ok) return new NextResponse(null, { status: 404 });
  return new NextResponse(await img.arrayBuffer(), {
    headers: {
      "Content-Type": img.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=21600",
    },
  });
}
