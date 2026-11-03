import { NextResponse } from "next/server";
import { hubAdminKey, hubFetch } from "@/lib/hub";
import { isAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ path: string[] }> };

/** Admin-only pass-through to the hub's /hub/admin/* API. */
async function forward(request: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нет доступа." }, { status: 401 });
  }
  const key = hubAdminKey();
  if (!key) {
    return NextResponse.json({ error: "HUB_ADMIN_KEY не задан." }, { status: 503 });
  }
  const { path } = await params;
  const body = request.method === "GET" ? undefined : await request.text();
  const res = await hubFetch(`/hub/admin/${path.map(encodeURIComponent).join("/")}`, key, {
    method: request.method,
    body,
  }).catch(() => null);
  if (!res) {
    return NextResponse.json({ error: "Хаб не отвечает." }, { status: 502 });
  }
  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export { forward as GET, forward as POST, forward as DELETE };
