import Link from "next/link";
import { AdminPanel } from "@/components/AdminPanel";
import { readTokens } from "@/lib/access";
import { isAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const admin = await isAdmin();
  const { error } = await searchParams;

  return (
    <div className="container">
      <div className="topbar">
        <Link href="/" className="back">
          ← Назад
        </Link>
        <span className="wordmark">iliasvpn · admin</span>
      </div>

      {admin ? (
        <AdminPanel
          initialTokens={await readTokens()}
          writable={Boolean(process.env.VERCEL_API_TOKEN && process.env.EDGE_CONFIG_ID)}
        />
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
