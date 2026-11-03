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

/** This key's estimated share of the weekly limit, shown inside the account total. */
export function KeyLimit({ share, limits }: { share: number; limits: Limit[] }) {
  const total = limits.find((l) => l.window === "7d")?.utilization ?? 0;
  return (
    <div className="key-limit">
      <div className="limit-head">
        <span>Этот ключ за неделю</span>
        <span className="limit-pct">≈{pct(share)}</span>
      </div>
      <div className="limit-track">
        <div className="limit-fill limit-fill-muted" style={{ width: `${Math.min(100, total * 100)}%` }}>
          <div className="limit-fill" style={{ width: total > 0 ? `${Math.min(100, (share / total) * 100)}%` : 0 }} />
        </div>
      </div>
      <p className="limit-note">Доля недельного лимита аккаунта — оценка по запросам через хаб</p>
    </div>
  );
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

const WINDOW_NAMES: Record<string, string> = {
  "7d": "Недельный лимит",
  "5h": "Лимит на 5 часов",
};

export function LimitBars({ limits }: { limits: Limit[] }) {
  const shown = limits.filter((l) => WINDOW_NAMES[l.window]);
  if (shown.length === 0) {
    return <p className="step-note">Лимиты появятся после первого запроса через хаб.</p>;
  }
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
