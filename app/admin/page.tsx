import Link from "next/link";
import { AdminPanel } from "@/components/AdminPanel";
import { HubAdmin } from "@/components/HubAdmin";
import { HUB_URL } from "@/lib/hub";
import { readTokensFresh } from "@/lib/access-store";
import { isAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tab?: string }>;
}) {
  const admin = await isAdmin();
  const { error, tab } = await searchParams;
  const links = tab === "links";

  return (
    <div className="container">
      <div className="topbar">
        <Link href="/" className="back">
          ← Назад
        </Link>
        <span className="wordmark">iliasvpn · admin</span>
      </div>

      {admin ? (
        <>
          <nav className="tabs">
            <Link href="/admin" className={`tab${links ? "" : " tab-active"}`}>
              Claude Code
            </Link>
            <Link href="/admin?tab=links" className={`tab${links ? " tab-active" : ""}`}>
              Приглашения
            </Link>
          </nav>
          {links ? (
            <AdminPanel
              initialTokens={await readTokensFresh().catch(() => ({}))}
              writable={Boolean(process.env.VERCEL_API_TOKEN && process.env.EDGE_CONFIG_ID)}
            />
          ) : (
            <HubAdmin hub={HUB_URL} />
          )}
        </>
      ) : (
        <section className="section">
          <form className="admin-login" method="post" action="/api/admin/login">
            <p className="gate-title">Админка</p>
            <input
              className="gate-input"
              type="password"
              name="token"
              placeholder="ADMIN_TOKEN"
              autoFocus
            />
            {error && <p className="admin-error">Неверный токен.</p>}
            <button className="btn btn-dark gate-submit" type="submit">
              Войти
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
