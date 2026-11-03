import { NextResponse } from "next/server";
import {
  fetchMessages,
  ImapConfigError,
  isCategory,
} from "@/lib/imap";
import { getLoginEmail } from "@/lib/config";
import { currentViewer, viewerCan } from "@/lib/session";
import { recordVisit } from "@/lib/visit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category");
  if (!isCategory(category)) {
    return NextResponse.json(
      { error: "Unknown category. Use blancvpn or news." },
      { status: 400 },
    );
  }

  const viewer = await currentViewer();
  if (!viewerCan(viewer, "blancvpn")) {
    return NextResponse.json({ error: "Нет доступа.", code: "NO_ACCESS" }, { status: 401 });
  }
  if (viewer && !viewer.admin && category !== "news") {
    await recordVisit(viewer.name, category).catch((err) => console.error("[api/messages] visit", err));
  }

  try {
    const messages = await fetchMessages(category);
    return NextResponse.json(
      {
        category,
        messages,
        loginEmail: getLoginEmail(),
        fetchedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof ImapConfigError) {
      return NextResponse.json(
        { error: err.message, code: "IMAP_NOT_CONFIGURED" },
        { status: 503 },
      );
    }
    console.error("[api/messages]", err);
    return NextResponse.json(
      { error: "Could not reach the mailbox.", code: "IMAP_ERROR" },
      { status: 502 },
    );
  }
}
