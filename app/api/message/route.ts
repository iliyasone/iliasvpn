import { NextResponse } from "next/server";
import {
  fetchMessageBody,
  ImapConfigError,
  isCategory,
} from "@/lib/imap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const category = params.get("category");
  const uid = Number(params.get("uid"));

  if (!isCategory(category)) {
    return NextResponse.json({ error: "Unknown category." }, { status: 400 });
  }
  if (!Number.isInteger(uid) || uid <= 0) {
    return NextResponse.json({ error: "Invalid uid." }, { status: 400 });
  }

  try {
    const message = await fetchMessageBody(category, uid);
    if (!message) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }
    return NextResponse.json(message, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof ImapConfigError) {
      return NextResponse.json(
        { error: err.message, code: "IMAP_NOT_CONFIGURED" },
        { status: 503 },
      );
    }
    console.error("[api/message]", err);
    return NextResponse.json(
      { error: "Could not reach the mailbox.", code: "IMAP_ERROR" },
      { status: 502 },
    );
  }
}
