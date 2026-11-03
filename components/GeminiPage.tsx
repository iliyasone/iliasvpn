import { Topbar } from "./Topbar";
import { CopyButton } from "./CopyButton";
import { Secret } from "./Secret";
import { GeminiStats, ago } from "./HubUsage";
import { GEMINI_URL, type HubMe } from "@/lib/hub";
import { ciaoDownloads } from "@/lib/ciao";

/** /gemini: dictation in Ciao through the shared Google key — what this key spent and how to set Ciao up. */
export async function GeminiPage({ me }: { me: HubMe }) {
  const { key } = me;
  const usage = key.gemini_usage;
  const link = `${GEMINI_URL}/?key=${key.key}`;
  const ciao = await ciaoDownloads();
  return (
    <div className="container">
      <Topbar back="/" />

      <div className="key-head">
        <h1 className="key-name">Gemini для Ciao</h1>
        <p className="step-note">
          {key.name} · последняя диктовка: {ago(usage.total.last_used_at)}
        </p>
      </div>

      <section className="section">
        <h2 className="section-title">Расход</h2>
        <GeminiStats usage={usage} />
        <p className="step-note">Оценка по минутам звука, как её считает сам Ciao: диктовка — $0.009 за минуту, расшифровка файла — $0.005.</p>
      </section>

      <section className="section">
        <h2 className="section-title">Настройка Ciao</h2>
        <ol className="steps">
          <li className="step">
            <div className="step-body">
              <p className="step-lead">Скачайте и установите Ciao{ciao.version ? ` ${ciao.version}` : ""}</p>
              <div className="install-links">
                {ciao.links.map((l) => (
                  <a key={l.url} href={l.url} className="install-link">
                    {l.label}
                    <span>{l.hint}</span>
                  </a>
                ))}
                <a href={ciao.page} target="_blank" rel="noopener noreferrer" className="install-link">
                  Все версии
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </li>
          <li className="step">
            <div className="step-body">
              <p className="step-lead">Скопируйте ссылку для Ciao</p>
              <div className="email-chip">
                <code>
                  {GEMINI_URL}/?key=<Secret value={key.key} />
                </code>
                <CopyButton value={link} label="Копировать" />
              </div>
              <p className="step-note">Это ваш личный ключ: не пересылайте его другим.</p>
            </div>
          </li>
          <li className="step">
            <div className="step-body">
              <p className="step-lead">Ciao → Настройки → «Кто распознаёт» → Google Gemini → «Использовать»</p>
              <p className="step-note">На Android — выберите Google Gemini в том же разделе.</p>
            </div>
          </li>
          <li className="step">
            <div className="step-body">
              <p className="step-lead">Вставьте ссылку в поле «API-ключ» и нажмите «Сохранить»</p>
              <p className="step-note">На Android — в поле «Ключ Gemini API», сохраняется само. Ключ Google не нужен: Ciao будет ходить в Gemini через этот сервер.</p>
            </div>
          </li>
          <li className="step">
            <div className="step-body">
              <p className="step-lead">Зажмите правый Ctrl и говорите</p>
              <p className="step-note">На Mac — правый Option, на Android — кнопка в шторке или пузырь.</p>
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
}
