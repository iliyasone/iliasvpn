import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { Collapsible } from "@/components/Collapsible";
import { CopyButton } from "@/components/CopyButton";
import { DailyChart, LimitBars, ModelList, StatRow, ago } from "@/components/HubUsage";
import { HUB_URL, currentHubKey } from "@/lib/hub";
import { settingsSnippet, setupCommand, usageCommand } from "@/lib/hub-setup";

export const dynamic = "force-dynamic";

export default async function CodePage({
  searchParams,
}: {
  searchParams: Promise<{ bad?: string }>;
}) {
  const me = await currentHubKey();
  const { bad } = await searchParams;

  return (
    <div className="container">
      <div className="topbar">
        <Link href="/" className="back">
          ← Назад
        </Link>
        <span className="wordmark">iliasvpn · Claude Code</span>
      </div>

      {!me ? (
        <section className="section">
          <form className="admin-login" method="get" action="/code">
            <p className="gate-title">Ключ Claude Code</p>
            <p className="step-note">Откройте ссылку с ключом или вставьте ключ сюда.</p>
            <input
              className="gate-input"
              type="password"
              name="key"
              placeholder="sk-hub-…"
              autoComplete="off"
            />
            {bad && <p className="admin-error">Ключ не найден или отозван.</p>}
            <button className="btn btn-dark gate-submit" type="submit">
              Открыть
            </button>
          </form>
        </section>
      ) : (
        <>
          <div className="key-head">
            <h1 className="key-name">{me.key.name}</h1>
            <p className="step-note">Последний запрос: {ago(me.key.total.last_used_at)}</p>
          </div>

          <section className="section">
            <h2 className="section-title">Расход</h2>
            <LimitBars limits={me.limits} />
            <StatRow today={me.key.today} week={me.key.week} total={me.key.total} />
            <DailyChart daily={me.key.daily} />
            <Collapsible title="По моделям за неделю">
              <ModelList models={me.key.models} />
              {me.key.models.length === 0 && <p>За эту неделю запросов не было.</p>}
            </Collapsible>
          </section>

          <section className="section">
            <h2 className="section-title">Подключить машину</h2>
            <ol className="steps">
              <li className="step">
                <div className="step-body">
                  <p className="step-lead">Выполните на машине</p>
                  <CodeBlock value={setupCommand(HUB_URL, me.key.key)} />
                  <Collapsible title="Или вручную: ~/.claude/settings.json">
                    <CodeBlock value={settingsSnippet(HUB_URL, me.key.key)} />
                  </Collapsible>
                </div>
              </li>
              <li className="step">
                <div className="step-body">
                  <p className="step-lead">Перезапустите Claude Code</p>
                  <p className="step-note">
                    Новые сессии пойдут через хаб. Входить в аккаунт на машине не нужно.
                  </p>
                </div>
              </li>
              <li className="step">
                <div className="step-body">
                  <p className="step-lead">Расход прямо с машины</p>
                  <CodeBlock value={usageCommand(HUB_URL, me.key.key)} />
                </div>
              </li>
            </ol>
          </section>

          <section className="section">
            <h2 className="section-title">Ключ</h2>
            <div className="email-chip">
              <code>{me.key.key_hint}</code>
              <CopyButton value={me.key.key} label="Копировать ключ" />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
