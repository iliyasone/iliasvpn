import { Topbar } from "./Topbar";
import { CodeBlock } from "./CodeBlock";
import { Collapsible } from "./Collapsible";
import { CopyButton } from "./CopyButton";
import { Secret } from "./Secret";
import { DailyChart, LimitBars, ModelList, StatRow, WeekBar, ago } from "./HubUsage";
import { HUB_URL, type HubMe } from "@/lib/hub";
import { settingsSnippet, setupCommand, usageCommand } from "@/lib/hub-setup";

/** /claude for the signed-in key (person or agent): the account's limits, this key's spend, and how to connect. */
export function AgentPage({ me }: { me: HubMe }) {
  const { key } = me;
  return (
    <div className="container">
      <Topbar back="/" />

      <div className="key-head">
        <h1 className="key-name">{key.name}</h1>
        <p className="step-note">Последний запрос: {ago(key.total.last_used_at)}</p>
      </div>

      <section className="section">
        <h2 className="section-title">Общие лимиты аккаунта</h2>
        <WeekBar
          limits={me.limits}
          segments={[{ label: `${key.name} — вы`, color: key.color, value: key.week_limit }]}
          restLabel="Остальные"
        />
        <LimitBars limits={me.limits} />
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
            <code><Secret value={key.key} /></code>
            <CopyButton value={key.key} label="Копировать" />
          </dd>
        </dl>
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
              <CodeBlock value={`ANTHROPIC_BASE_URL=${HUB_URL}\nANTHROPIC_AUTH_TOKEN=${key.key}`} secret={key.key} />
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
        <CodeBlock value={setupCommand(HUB_URL, key.key)} secret={key.key} />
        <Collapsible title="Или вручную: ~/.claude/settings.json">
          <CodeBlock value={settingsSnippet(HUB_URL, key.key)} secret={key.key} />
        </Collapsible>
      </section>

      <section className="section">
        <h2 className="section-title">Проверить с машины</h2>
        <p className="step-note">Лимиты и расход этого ключа текстом:</p>
        <CodeBlock value={usageCommand(HUB_URL, key.key)} secret={key.key} />
      </section>
    </div>
  );
}
