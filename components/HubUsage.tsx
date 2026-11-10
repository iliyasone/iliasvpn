// Usage widgets shared by the key page and the admin dashboard.

export interface Totals {
  cost: number;
  requests: number;
  tokens: number;
  last_used_at: number | null;
}

export interface Limit {
  window: string;
  utilization: number;
  reset: number | null;
}

export function money(n: number): string {
  if (n === 0) return "$0";
  if (n < 0.01) return "<$0.01";
  if (n < 100) return `$${n.toFixed(2)}`;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/** Share of the weekly limit, e.g. 0.023 → "2.3%". */
export function pct(f: number): string {
  const v = f * 100;
  if (v === 0) return "0%";
  if (v < 0.1) return "<0.1%";
  return `${v < 10 ? v.toFixed(1) : Math.round(v)}%`;
}

export function when(ts: number | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ago(ts: number | null | undefined): string {
  if (!ts) return "не использовался";
  const s = Date.now() / 1000 - ts;
  if (s < 90) return "только что";
  if (s < 3600) return `${Math.round(s / 60)} мин назад`;
  if (s < 86400) return `${Math.round(s / 3600)} ч назад`;
  return `${Math.round(s / 86400)} дн назад`;
}

/** Part of the weekly limit Anthropic gave back mid-week (0..1) and when. */
export interface Returned {
  share: number;
  at: number;
}

export interface Segment {
  label: string;
  color: string;
  /** Share of the account's weekly limit, 0..1. */
  value: number;
}

const REST_COLOR = "var(--rest)";

/**
 * The account's weekly limit as one bar: a colored part per key (estimated from requests
 * through the hub), the rest of the used part in gray, and what is left. When Anthropic gave
 * limit back mid-week, the bar is the limit plus what came back, with a mark at the usual limit.
 */
export function WeekBar({
  limits,
  segments,
  restLabel,
  returned,
}: {
  limits: Limit[];
  segments: Segment[];
  restLabel: string;
  returned?: Returned | null;
}) {
  const week = limits.find((l) => l.window === "7d");
  if (!week) {
    return <p className="step-note">Лимиты появятся после первого запроса через хаб.</p>;
  }
  const used = Math.min(1, week.utilization);
  const back = returned?.share ?? 0;
  const spent = used + back;
  const full = 1 + back;
  const keyed = [...segments].sort((a, b) => b.value - a.value);
  const rest = Math.max(0, spent - keyed.reduce((sum, s) => sum + s.value, 0));
  const parts = [...keyed, { label: restLabel, color: REST_COLOR, value: rest }];
  return (
    <div className="week">
      <div className="limit-head">
        <span>Неделя · весь аккаунт</span>
        <span className="limit-pct">осталось {Math.round((1 - used) * 100)}%</span>
      </div>
      <div className="week-bar">
        <div className="limit-track week-track">
          {parts.map((p) => (
            <div key={p.label} title={`${p.label}: ${pct(p.value)}`} style={{ width: `${(p.value / full) * 100}%`, background: p.color }} />
          ))}
        </div>
        {back > 0 && <span className="week-mark" style={{ left: `${100 / full}%` }} title="Обычный недельный лимит" />}
      </div>
      {back > 0 ? (
        <p className="limit-note">
          Потрачено {Math.round(spent * 100)}% обычного лимита · Anthropic вернул {Math.round(back * 100)}% {when(returned?.at)}
          <br />
          Черта — обычный лимит · сброс {when(week.reset)} МСК
        </p>
      ) : (
        <p className="limit-note">
          Использовано {Math.round(used * 100)}% · сброс {when(week.reset)} МСК
        </p>
      )}
      <ul className="split">
        {parts.map((p) => (
          <li key={p.label}>
            <span>
              <i className="dot" style={{ background: p.color }} />
              {p.label}
            </span>
            <span>{pct(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Part of the account weekly limit each model family (Opus, Fable…) used this week. An estimate, like the
 * split by key: each rise of the limit goes to the requests before it in proportion to their cost.
 */
export function WeekModels({ models }: { models: { model: string; share: number }[] }) {
  const families = new Map<string, number>();
  for (const m of models) {
    const word = m.model.split("-")[1] ?? m.model;
    const family = word[0].toUpperCase() + word.slice(1);
    families.set(family, (families.get(family) ?? 0) + m.share);
  }
  const rows = [...families].filter(([, share]) => share >= 0.0005).sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) return null;
  return (
    <div className="week">
      <div className="limit-head">
        <span>Неделя · по моделям</span>
      </div>
      <ul className="split">
        {rows.map(([family, share]) => (
          <li key={family}>
            <span>{family}</span>
            <span>{pct(share)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const WINDOW_NAMES: Record<string, string> = {
  "5h": "Лимит на 5 часов",
  "7d_oi": "Недельный лимит Fable",
};

/** Limits besides the account's weekly one, when Anthropic reports them: 5 hours, and the week of Fable alone. */
export function LimitBars({ limits }: { limits: Limit[] }) {
  const shown = limits.filter((l) => WINDOW_NAMES[l.window]);
  if (shown.length === 0) return null;
  return (
    <div className="limits">
      {shown.map((l) => {
        const pct = Math.min(100, Math.round(l.utilization * 100));
        const tone = pct >= 90 ? " limit-fill-hot" : pct >= 70 ? " limit-fill-warm" : "";
        return (
          <div key={l.window} className="limit">
            <div className="limit-head">
              <span>{WINDOW_NAMES[l.window]}</span>
              <span className="limit-pct">{pct}%</span>
            </div>
            <div className="limit-track">
              <div className={`limit-fill${tone}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="limit-note">Весь аккаунт · сброс {when(l.reset)} МСК</p>
          </div>
        );
      })}
    </div>
  );
}

export function StatRow({ today, week, total }: { today: Totals; week: Totals; total?: Totals }) {
  const cells: [string, Totals][] = [
    ["Сегодня", today],
    ["Эта неделя", week],
  ];
  if (total) cells.push(["Всего", total]);
  return (
    <div className="stats">
      {cells.map(([label, t]) => (
        <div key={label} className="stat">
          <span className="stat-label">{label}</span>
          <span className="stat-value">{money(t.cost)}</span>
          <span className="stat-sub">{t.requests.toLocaleString("ru-RU")} запр.</span>
        </div>
      ))}
    </div>
  );
}

export function DailyChart({ daily }: { daily: { date: string; cost: number }[] }) {
  const max = Math.max(...daily.map((d) => d.cost), 0);
  return (
    <div className="chart">
      <div className="chart-bars">
        {daily.map((d) => (
          <div key={d.date} className="chart-col" title={`${d.date.slice(8)}.${d.date.slice(5, 7)}: ${money(d.cost)}`}>
            <div
              className="chart-bar"
              style={{ height: max > 0 ? `${Math.max(d.cost > 0 ? 4 : 0, (d.cost / max) * 100)}%` : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="chart-axis">
        <span>{daily.length ? `${daily[0].date.slice(8)}.${daily[0].date.slice(5, 7)}` : ""}</span>
        <span>макс. {money(max)} в день</span>
        <span>сегодня</span>
      </div>
    </div>
  );
}

export function ModelList({ models }: { models: { model: string; cost: number; requests: number }[] }) {
  if (models.length === 0) return null;
  return (
    <ul className="models">
      {models.map((m) => (
        <li key={m.model}>
          <code>{m.model}</code>
          <span>
            {money(m.cost)} · {m.requests} запр.
          </span>
        </li>
      ))}
    </ul>
  );
}

export interface GeminiTotals {
  cost: number;
  minutes: number;
  requests: number;
  last_used_at: number | null;
}

/** Gemini dictation through the proxy: today, 7 and 30 days — dollars and minutes of audio. */
export function GeminiStats({ usage }: { usage: { today: GeminiTotals; week: GeminiTotals; month: GeminiTotals } }) {
  const cells: [string, GeminiTotals][] = [
    ["Сегодня", usage.today],
    ["7 дней", usage.week],
    ["30 дней", usage.month],
  ];
  return (
    <div className="stats">
      {cells.map(([label, t]) => (
        <div key={label} className="stat">
          <span className="stat-label">{label}</span>
          <span className="stat-value">{money(t.cost)}</span>
          <span className="stat-sub">{minutes(t.minutes)}</span>
        </div>
      ))}
    </div>
  );
}

export function minutes(m: number): string {
  if (m === 0) return "0 мин";
  if (m < 1) return "<1 мин";
  return m < 120 ? `${Math.round(m)} мин` : `${(m / 60).toFixed(1).replace(".", ",")} ч`;
}
