import { NextResponse } from "next/server";
import { isTokenShaped, readTokens } from "@/lib/access";
import {
  AccessStoreError,
  createInvite,
  deleteInvite,
  restoreInvite,
  revokeInvite,
} from "@/lib/access-store";
import { isAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function denied() {
  return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
}

function failed(err: unknown) {
  if (err instanceof AccessStoreError) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }
  console.error("[api/admin/tokens]", err);
  return NextResponse.json({ error: "Внутренняя ошибка." }, { status: 500 });
}

export async function GET() {
  if (!(await isAdmin())) return denied();
  return NextResponse.json(
    { tokens: await readTokens() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return denied();
  const body = (await request.json().catch(() => ({}))) as { name?: unknown };
  const name =
    typeof body.name === "string" ? body.name.replace(/\s+/g, " ").trim().slice(0, 64) : "";
  if (name.length < 1) {
    return NextResponse.json({ error: "Нужно имя." }, { status: 400 });
  }
  try {
    const { token, entry } = await createInvite(name);
    return NextResponse.json({ token, entry });
  } catch (err) {
    return failed(err);
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return denied();
  const body = (await request.json().catch(() => ({}))) as {
    token?: unknown;
    action?: unknown;
  };
  if (!isTokenShaped(body.token)) {
    return NextResponse.json({ error: "Плохой токен." }, { status: 400 });
  }
  try {
    let ok = false;
    if (body.action === "revoke") ok = await revokeInvite(body.token);
    else if (body.action === "restore") ok = await restoreInvite(body.token);
    else if (body.action === "delete") ok = await deleteInvite(body.token);
    else return NextResponse.json({ error: "Неизвестное действие." }, { status: 400 });
    if (!ok) return NextResponse.json({ error: "Не найдено." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return failed(err);
  }
}
