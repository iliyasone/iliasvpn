import Link from "next/link";
import { EmailChip } from "@/components/EmailChip";
import { Inbox } from "@/components/Inbox";
import { VisitorGate } from "@/components/VisitorGate";
import { getLoginEmail } from "@/lib/config";

export default function ClaudePage() {
  const email = getLoginEmail();

  return (
    <div className="container">
      <VisitorGate page="claude" />
      <div className="topbar">
        <Link href="/" className="back">
          ← Назад
        </Link>
        <span className="wordmark">iliasvpn</span>
      </div>

      <div className="flow-head">
        <img src="/logos/claude.png" alt="Claude" />
      </div>

      <section className="section">
        <h2 className="section-title">Как войти</h2>
        <ol className="steps">
          <li className="step">
            <div className="step-body">
              <p className="step-lead">Откройте Claude.ai</p>
              <a
                className="btn btn-outline"
                href="https://claude.ai/login"
                target="_blank"
                rel="noopener noreferrer"
              >
                Перейти на claude.ai →
              </a>
            </div>
          </li>
          <li className="step">
            <div className="step-body">
              <p className="step-lead">Нажмите «Log in» и выберите вход по email</p>
            </div>
          </li>
          <li className="step">
            <div className="step-body">
              <p className="step-lead">Введите тот же адрес</p>
              <EmailChip email={email} />
            </div>
          </li>
          <li className="step">
            <div className="step-body">
              <p className="step-lead">Запросите ссылку</p>
              <p className="step-note">Ссылка для входа появится ниже.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="section">
        <h2 className="section-title">Письма</h2>
        <Inbox
          primary="claude"
          kind="link"
          accent="claude"
          emptyText="Здесь появятся письма входа Claude.ai."
        />
      </section>
    </div>
  );
}
