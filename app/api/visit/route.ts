import { NextResponse } from "next/server";
import { notifyTelegram } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_NAMES: Record<string, string> = {
  claude: "Claude",
  blancvpn: "BlancVPN",
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON." }, { status: 400 });
  }

  const { handle, page, firstVisit } = (body ?? {}) as {
    handle?: unknown;
    page?: unknown;
    firstVisit?: unknown;
  };

  const pageName = typeof page === "string" ? PAGE_NAMES[page] : undefined;
  const cleanHandle =
    typeof handle === "string" ? handle.replace(/\s+/g, " ").trim().slice(0, 64) : "";
  if (!pageName || cleanHandle.length < 2) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const text = firstVisit
    ? `🆕 ${cleanHandle} — первый визит, страница ${pageName}`
    : `👤 ${cleanHandle} открыл(а) страницу ${pageName}`;

  const sent = await notifyTelegram(text).catch((err) => {
    console.error("[api/visit]", err);
    return false;
  });
  return NextResponse.json({ ok: sent });
}
