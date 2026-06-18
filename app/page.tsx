import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <div className="page">
      <SiteHeader />

      <main className="home">
        <section className="hero">
          <h1 className="hero-title">
            Коды и ссылки для входа — <span className="accent">мгновенно</span>
          </h1>
          <p className="hero-sub">
            Сервис показывает одноразовые коды BlancVPN и безопасные ссылки входа
            Claude.ai, как только они приходят на почту. Никаких переключений
            между приложениями — открыли страницу, запросили код, увидели его
            здесь.
          </p>
        </section>

        <section className="choices">
          <Link href="/blancvpn" className="choice choice-blanc">
            <span className="choice-icon" aria-hidden>
              🛡️
            </span>
            <span className="choice-body">
              <span className="choice-title">BlancVPN</span>
              <span className="choice-desc">
                Установка приложения, вход по коду и новости сервиса.
              </span>
            </span>
            <span className="choice-go" aria-hidden>
              →
            </span>
          </Link>

          <Link href="/claude" className="choice choice-claude">
            <span className="choice-icon" aria-hidden>
              ✳️
            </span>
            <span className="choice-body">
              <span className="choice-title">Claude.ai</span>
              <span className="choice-desc">
                Вход на claude.ai по безопасной ссылке из письма.
              </span>
            </span>
            <span className="choice-go" aria-hidden>
              →
            </span>
          </Link>
        </section>
      </main>

      <footer className="site-footer">
        <span>iliasvpn</span>
        <span>письма читаются только на бэкенде по IMAP</span>
      </footer>
    </div>
  );
}
