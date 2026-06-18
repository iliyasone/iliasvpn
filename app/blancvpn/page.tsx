import { SiteHeader } from "@/components/SiteHeader";
import { InstallButtons } from "@/components/InstallButtons";
import { EmailChip } from "@/components/EmailChip";
import { Collapsible } from "@/components/Collapsible";
import { BlancVpnMessages } from "@/components/BlancVpnMessages";
import { NewsMessages } from "@/components/NewsMessages";
import { getLoginEmail } from "@/lib/config";

export default function BlancVpnPage() {
  const loginEmail = getLoginEmail();

  return (
    <div className="page page-blanc">
      <SiteHeader active="blancvpn" />

      <main className="flow">
        <header className="flow-head">
          <h1 className="flow-title">Вход в BlancVPN по коду</h1>
          <p className="flow-sub">
            Установите приложение, войдите по адресу почты и дождитесь кода — он
            появится здесь автоматически.
          </p>
        </header>

        {/* Live code first — that's what people came for. */}
        <section className="card card-accent-blanc">
          <BlancVpnMessages />
        </section>

        <section className="card">
          <h2 className="card-title">Как войти</h2>

          <ol className="steps">
            <li className="step">
              <span className="step-num">1</span>
              <div className="step-body">
                <p className="step-lead">Установите приложение BlancVPN</p>
                <InstallButtons />
              </div>
            </li>

            <li className="step">
              <span className="step-num">2</span>
              <div className="step-body">
                <p className="step-lead">
                  Откройте приложение и войдите по адресу
                </p>
                <EmailChip email={loginEmail} />
              </div>
            </li>

            <li className="step">
              <span className="step-num">3</span>
              <div className="step-body">
                <p className="step-lead">Дождитесь кода</p>
                <p className="step-note">
                  Код придёт на почту и сразу появится в карточке выше.
                </p>
              </div>
            </li>
          </ol>

          <Collapsible title="Не приходит код">
            <p>
              Если код приходит только с первой попытки и не отправляется
              повторно на одном устройстве, это похоже на временное ограничение
              или сбой на стороне устройства или сети.
            </p>
            <p>Попробуйте следующее:</p>
            <ul className="tips">
              <li>
                Подождать 10–15 минут перед повторной попыткой (частые запросы
                могут блокироваться).
              </li>
              <li>Попробовать войти с другого устройства или браузера.</li>
              <li>
                Переключиться на другую сеть (например, с Wi‑Fi на мобильный
                интернет).
              </li>
              <li>Открыть страницу входа в режиме инкогнито.</li>
            </ul>
          </Collapsible>
        </section>

        <section className="card">
          <h2 className="card-title">Новости</h2>
          <p className="card-subtitle">Письма от blancvpn.org</p>
          <NewsMessages />
        </section>
      </main>
    </div>
  );
}
