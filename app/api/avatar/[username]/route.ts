import { NextResponse } from "next/server";
import { isHubTelegram } from "@/lib/hub";
import { telegramProfile } from "@/lib/telegram-profile";

export const runtime = "nodejs";

const TELEGRAM_RE = /^[A-Za-z0-9_]{4,32}$/;

/** Telegram avatar of a key's owner, served from this site. */
export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  if (!TELEGRAM_RE.test(username) || !(await isHubTelegram(username))) {
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
