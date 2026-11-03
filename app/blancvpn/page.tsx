import { InstallButtons } from "@/components/InstallButtons";
import { EmailChip } from "@/components/EmailChip";
import { Collapsible } from "@/components/Collapsible";
import { Inbox } from "@/components/Inbox";
import { Locked } from "@/components/Locked";
import { currentViewer, viewerCan } from "@/lib/session";
import { Topbar } from "@/components/Topbar";
import { getLoginEmail } from "@/lib/config";

export default async function BlancVpnPage() {
  const viewer = await currentViewer();
  if (!viewerCan(viewer, "blancvpn")) {
    return <Locked logo="/logos/blancvpn.png" alt="BlancVPN" signedIn={Boolean(viewer)} />;
  }
  const email = getLoginEmail();

  return (
    <div className="container">
      <Topbar back="/" />

      <div className="flow-head">
        <img src="/logos/blancvpn.png" alt="BlancVPN" />
      </div>

      <section className="section">
        <h2 className="section-title">Как войти</h2>
        <ol className="steps">
          <li className="step">
            <div className="step-body">
              <p className="step-lead">Установите приложение</p>
              <InstallButtons />
            </div>
          </li>
          <li className="step">
            <div className="step-body">
              <p className="step-lead">Откройте приложение и войдите по адресу</p>
              <EmailChip email={email} />
            </div>
          </li>
          <li className="step">
            <div className="step-body">
              <p className="step-lead">Запросите код</p>
              <p className="step-note">Код появится ниже автоматически.</p>
            </div>
          </li>
        </ol>

        <Collapsible title="Не приходит код">
          <p>
            Если код приходит только с первой попытки и не отправляется повторно
            на одном устройстве, это похоже на временное ограничение или сбой на
            стороне устройства или сети.
          </p>
          <p>Попробуйте следующее:</p>
          <ul>
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

      <section className="section">
        <h2 className="section-title">Письма</h2>
        <Inbox
          primary="blancvpn"
          also="news"
          kind="code"
          accent="blanc"
          emptyText="Здесь появятся коды и новости BlancVPN."
        />
      </section>
    </div>
  );
}
