import { NextResponse } from "next/server";
import { SERVICES, TELEGRAM_RE, isTokenShaped, type Service } from "@/lib/access";
import { telegramProfile } from "@/lib/telegram-profile";
import {
  AccessStoreError,
  createInvite,
  readTokensFresh,
  deleteInvite,
  restoreInvite,
  revokeInvite,
  setAccess,
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
  try {
    return NextResponse.json(
      { tokens: await readTokensFresh() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return failed(err);
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return denied();
  const body = (await request.json().catch(() => ({}))) as { name?: unknown; access?: unknown };
  let name =
    typeof body.name === "string" ? body.name.replace(/\s+/g, " ").trim().slice(0, 64) : "";
  if (name.length < 1) {
    return NextResponse.json({ error: "Нужен @ник в Telegram или имя." }, { status: 400 });
  }
  // "@username" or a t.me link → remember the username and take the display name from Telegram.
  const handle = name.replace(/^(https?:\/\/)?t\.me\//, "@").match(/^@([A-Za-z0-9_]{4,32})$/)?.[1];
  let telegram: string | undefined;
  if (handle && TELEGRAM_RE.test(handle)) {
    telegram = handle;
    name = (await telegramProfile(handle)).name ?? `@${handle}`;
  }
  const raw = (body.access ?? {}) as Partial<Record<Service, unknown>>;
  const access = Object.fromEntries(SERVICES.map((s) => [s, raw[s] === true])) as Record<Service, boolean>;
  try {
    const { token, entry } = await createInvite(name, telegram, access);
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
    service?: unknown;
    allowed?: unknown;
  };
  if (!isTokenShaped(body.token)) {
    return NextResponse.json({ error: "Плохой токен." }, { status: 400 });
  }
  try {
    let ok = false;
    if (body.action === "revoke") ok = await revokeInvite(body.token);
    else if (body.action === "restore") ok = await restoreInvite(body.token);
    else if (body.action === "delete") ok = await deleteInvite(body.token);
    else if (body.action === "access" && SERVICES.includes(body.service as Service) && typeof body.allowed === "boolean")
      ok = await setAccess(body.token, body.service as Service, body.allowed);
    else return NextResponse.json({ error: "Неизвестное действие." }, { status: 400 });
    if (!ok) return NextResponse.json({ error: "Не найдено." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return failed(err);
  }
}
