import { SiteHeader } from "@/components/SiteHeader";
import { EmailChip } from "@/components/EmailChip";
import { ClaudeMessages } from "@/components/ClaudeMessages";
import { getLoginEmail } from "@/lib/config";

export default function ClaudePage() {
  const loginEmail = getLoginEmail();

  return (
    <div className="page page-claude">
      <SiteHeader active="claude" />

      <main className="flow">
        <header className="flow-head">
          <h1 className="flow-title">Вход в Claude.ai по ссылке</h1>
          <p className="flow-sub">
            Откройте claude.ai, запросите вход по почте и дождитесь безопасной
            ссылки — она появится здесь.
          </p>
        </header>

        <section className="card card-accent-claude">
          <ClaudeMessages />
        </section>

        <section className="card">
          <h2 className="card-title">Как войти</h2>
          <ol className="steps">
            <li className="step">
              <span className="step-num">1</span>
              <div className="step-body">
                <p className="step-lead">Откройте Claude.ai</p>
                <a
                  className="btn-secondary"
                  href="https://claude.ai/login"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Перейти на claude.ai →
                </a>
              </div>
            </li>

            <li className="step">
              <span className="step-num">2</span>
              <div className="step-body">
                <p className="step-lead">
                  Нажмите «Log in» и выберите вход по email
                </p>
              </div>
            </li>

            <li className="step">
              <span className="step-num">3</span>
              <div className="step-body">
                <p className="step-lead">Введите тот же адрес</p>
                <EmailChip email={loginEmail} />
              </div>
            </li>

            <li className="step">
              <span className="step-num">4</span>
              <div className="step-body">
                <p className="step-lead">Дождитесь письма</p>
                <p className="step-note">
                  Безопасная ссылка для входа появится в карточке выше — нажмите
                  «Открыть ссылку входа».
                </p>
              </div>
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}
