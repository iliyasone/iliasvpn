import { Topbar } from "./Topbar";
import { CodeBlock } from "./CodeBlock";
import { Collapsible } from "./Collapsible";
import { CopyButton } from "./CopyButton";
import { DailyChart, KeyLimit, LimitBars, ModelList, StatRow, ago } from "./HubUsage";
import { HUB_URL, type HubMe } from "@/lib/hub";
import { settingsSnippet, setupCommand, usageCommand } from "@/lib/hub-setup";

/** /claude for a Claude Code key: the account's limits and how to connect a machine (Claude Code CLI or T3 Code). */
export function AgentPage({ me }: { me: HubMe }) {
  const { key } = me;
  return (
    <div className="container">
      <Topbar title="iliasvpn · Claude Code" as={{ name: key.name, telegram: key.telegram ?? undefined }} />

      <div className="key-head">
        <h1 className="key-name">{key.name}</h1>
        <p className="step-note">Последний запрос: {ago(key.total.last_used_at)}</p>
      </div>

      <section className="section">
        <h2 className="section-title">Общие лимиты аккаунта</h2>
        <LimitBars limits={me.limits} />
        <KeyLimit share={key.week_limit} limits={me.limits} />
        <StatRow today={key.today} week={key.week} total={key.total} />
        <Collapsible title="Расход ключа по дням и моделям">
          <DailyChart daily={key.daily} />
          <ModelList models={key.models} />
          {key.models.length === 0 && <p>За эту неделю запросов не было.</p>}
        </Collapsible>
      </section>

      <section className="section">
        <h2 className="section-title">Подключение</h2>
        <dl className="conn">
          <dt>Эндпоинт · ANTHROPIC_BASE_URL</dt>
          <dd className="email-chip">
            <code>{HUB_URL}</code>
            <CopyButton value={HUB_URL} label="Копировать" />
          </dd>
          <dt>Ключ · ANTHROPIC_AUTH_TOKEN</dt>
          <dd className="email-chip">
            <code>{key.key}</code>
            <CopyButton value={key.key} label="Копировать" />
          </dd>
        </dl>
        <p className="step-note">
          Входить в аккаунт Claude на машине не нужно: хаб сам ходит в общий аккаунт, расход записывается на этот ключ.
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">T3 Code</h2>
        <ol className="steps">
          <li className="step">
            <div className="step-body">
              <p className="step-lead">Settings → Providers → карточка Claude</p>
              <p className="step-note">Тот провайдер, через который должны идти треды этой машины.</p>
            </div>
          </li>
          <li className="step">
            <div className="step-body">
              <p className="step-lead">Environment → Variables → Add variable — две переменные</p>
              <CodeBlock value={`ANTHROPIC_BASE_URL=${HUB_URL}\nANTHROPIC_AUTH_TOKEN=${key.key}`} />
              <p className="step-note">Ключ оставьте скрытым (sensitive).</p>
            </div>
          </li>
          <li className="step">
            <div className="step-body">
              <p className="step-lead">Начните новый тред</p>
              <p className="step-note">Новые треды этого провайдера пойдут через хаб, уже открытые — как шли.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="section">
        <h2 className="section-title">Claude Code в терминале</h2>
        <p className="step-note">Команда записывает обе переменные в ~/.claude/settings.json на машине.</p>
        <CodeBlock value={setupCommand(HUB_URL, key.key)} />
        <Collapsible title="Или вручную: ~/.claude/settings.json">
          <CodeBlock value={settingsSnippet(HUB_URL, key.key)} />
        </Collapsible>
      </section>

      <section className="section">
        <h2 className="section-title">Проверить с машины</h2>
        <p className="step-note">Лимиты и расход этого ключа текстом:</p>
        <CodeBlock value={usageCommand(HUB_URL, key.key)} />
      </section>
    </div>
  );
}
