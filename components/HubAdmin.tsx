"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Avatar } from "./Avatar";
import { CopyButton } from "./CopyButton";
import {
  DailyChart,
  LimitBars,
  WeekBar,
  WeekModels,
  ModelList,
  ago,
  minutes,
  money,
  pct,
  when,
  type GeminiTotals,
  type Limit,
  type Totals,
} from "./HubUsage";
import { keyPageUrl, setupCommand, usageCommand } from "@/lib/hub-setup";

interface Day {
  date: string;
  /** Claude, dollars. */
  cost: number;
  /** Gemini, dollars. */
  gemini: number;
}

interface Key {
  id: number;
  name: string;
  telegram: string | null;
  color: string;
  claude: boolean;
  gemini: boolean;
  blancvpn: boolean;
  admin: boolean;
  /** Id of the person's main key this key belongs to. */
  owner: number | null;
  key: string;
  key_hint: string;
  created_at: number;
  revoked_at: number | null;
  today: Totals;
  week: Totals;
  total: Totals;
  daily: Day[];
  models: { model: string; cost: number; requests: number }[];
  week_limit: number;
  gemini_usage: GeminiUsage;
}

interface GeminiUsage {
  today: GeminiTotals;
  week: GeminiTotals;
  month: GeminiTotals;
  total: GeminiTotals;
}

interface Overview {
  keys: Key[];
  limits: Limit[];
  week_baseline: number | null;
  /** Part of the weekly limit each model used this week. */
  week_models?: { model: string; share: number }[];
  week: Totals;
  today: Totals;
  total: Totals;
  daily: Day[];
  gemini: GeminiUsage;
}

/** One weekly-limit week: the account limit used per Moscow day, split by key (id null: a deleted key). */
interface Week {
  start: number;
  reset: number;
  /** Already used when the hub first saw the week (usage before the hub). */
  baseline: number | null;
  /** Last value the hub saw. */
  utilization: number | null;
  days: { date: string; keys: { id: number | null; share: number; cost: number }[] }[];
}

/** Spend of one person or key, Claude and Gemini together. */
interface Spend {
  today: number;
  days7: number;
  total: number;
  claudeTotal: number;
  geminiTotal: number;
  minutes: number;
  weekLimit: number;
  last: number | null;
  daily: { date: string; cost: number }[];
}

/** A person: their main key and the keys of their machines and agents. */
interface Person {
  main: Key;
  keys: Key[];
  spend: Spend;
}

type Sort = "today" | "days7" | "total";

const SORTS: [Sort, string][] = [
  ["today", "Сегодня"],
  ["days7", "7 дней"],
  ["total", "Всё время"],
];

function origin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

function dayTotal(d: Day) {
  return d.cost + (d.gemini ?? 0);
}

function spendOf(keys: Key[]): Spend {
  const daily = keys[0].daily.map((d, i) => ({
    date: d.date,
    cost: keys.reduce((sum, k) => sum + dayTotal(k.daily[i]), 0),
  }));
  const sum = (f: (k: Key) => number) => keys.reduce((s, k) => s + f(k), 0);
  const lasts = keys.flatMap((k) => [k.total.last_used_at, k.gemini_usage.total.last_used_at]).filter((t): t is number => !!t);
  return {
    today: daily.length ? daily[daily.length - 1].cost : 0,
    days7: daily.slice(-7).reduce((s, d) => s + d.cost, 0),
    total: sum((k) => k.total.cost + k.gemini_usage.total.cost),
    claudeTotal: sum((k) => k.total.cost),
    geminiTotal: sum((k) => k.gemini_usage.total.cost),
    minutes: sum((k) => k.gemini_usage.total.minutes),
    weekLimit: sum((k) => k.week_limit),
    last: lasts.length ? Math.max(...lasts) : null,
    daily,
  };
}

/** Keys grouped by person: a key with an owner goes under that owner's key. Revoked keys keep their spend there. */
function people(keys: Key[]): Person[] {
  const mains = keys.filter((k) => !k.owner || !keys.some((o) => o.id === k.owner && !o.owner));
  return mains.map((main) => {
    const own = [main, ...keys.filter((k) => k.owner === main.id && k.id !== main.id)];
    return { main, keys: own, spend: spendOf(own) };
  });
}

/** A person whose every key is revoked. */
function isRevoked(p: Person) {
  return p.keys.every((k) => k.revoked_at);
}

/** Days from the first one with spend (at least the last 7). */
function fromFirstSpend<T>(days: T[], total: (d: T) => number): T[] {
  const first = days.findIndex((d) => total(d) > 0);
  return days.slice(Math.min(Math.max(0, first), Math.max(0, days.length - 7)));
}

function shortDate(date: string) {
  return `${date.slice(8)}.${date.slice(5, 7)}`;
}

export function HubAdmin({ hub }: { hub: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [weeks, setWeeks] = useState<Week[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>("total");
  const [showIdle, setShowIdle] = useState(false);
  const [showRevoked, setShowRevoked] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/hub/admin/keys", { cache: "no-store" }).catch(() => null);
    if (!res) return setError("Сайт не отвечает.");
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return setError(body.error ?? `Ошибка ${res.status}`);
    setError(null);
    setData(body as Overview);
    const w = await fetch("/api/hub/admin/weeks", { cache: "no-store" }).catch(() => null);
    if (w?.ok) setWeeks(((await w.json()) as { weeks: Week[] }).weeks);
  }, []);

  useEffect(() => {
    load();
    const t = window.setInterval(load, 30_000);
    return () => window.clearInterval(t);
  }, [load]);

  const call = useCallback(
    async (path: string, method: string, body?: unknown) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/hub/admin/${path}`, {
          method,
          headers: { "Content-Type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json.error ?? `Ошибка ${res.status}`);
          return null;
        }
        setError(null);
        await load();
        return json;
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const update = useCallback((k: Key, fields: Record<string, unknown>) => call(`keys/${k.id}/update`, "POST", fields), [call]);

  async function act(k: Key, action: "revoke" | "restore" | "delete") {
    if (action === "delete" && !confirm(`Удалить ключ «${k.name}»? Статистика по нему останется без имени.`)) return;
    if (action === "delete") return call(`keys/${k.id}`, "DELETE");
    return call(`keys/${k.id}/${action}`, "POST");
  }

  if (!data) {
    return <p className={error ? "admin-error" : "step-note"}>{error ?? "Загружаю…"}</p>;
  }

  const everyone = people(data.keys).sort(
    (a, b) => b.spend[sort] - a.spend[sort] || b.spend.total - a.spend.total || a.main.name.localeCompare(b.main.name),
  );
  const all = everyone.filter((p) => !isRevoked(p));
  const used = all.filter((p) => p.spend.total > 0);
  const idle = all.filter((p) => p.spend.total === 0);
  const revoked = everyone.filter(isRevoked);
  const mains = all.map((p) => p.main);
  const g = data.gemini;

  const rowProps = { hub, busy, mains, onUpdate: update, onAct: act };

  return (
    <>
      <div className="admin-top">
        <section className="section">
          <h2 className="section-title">Расход</h2>
          <div className="stats">
            <Stat label="Сегодня" claude={data.today.cost} gemini={g.today.cost} />
            <Stat
              label="7 дней"
              claude={data.daily.slice(-7).reduce((s, d) => s + d.cost, 0)}
              gemini={data.daily.slice(-7).reduce((s, d) => s + d.gemini, 0)}
            />
            <Stat label="Всё время" claude={data.total.cost} gemini={g.total.cost} />
          </div>
          <WeekBar
            limits={data.limits}
            segments={everyone
              .filter((p) => p.spend.weekLimit > 0)
              .map((p) => ({ label: p.main.name, color: p.main.color, value: p.spend.weekLimit }))}
            restLabel={data.week_baseline === null ? "Без хаба" : "До хаба и мимо него"}
          />
          <WeekModels models={data.week_models ?? []} />
          <LimitBars limits={data.limits} />
        </section>

        <section className="section">
          <h2 className="section-title">Недельный лимит по дням</h2>
          {weeks && weeks.length > 0 ? <WeekByDay people={everyone} weeks={weeks} /> : <p className="admin-meta">Хаб ещё не видел лимит.</p>}
        </section>
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Люди ({all.length})</h2>
          <button type="button" className="btn btn-outline btn-small" onClick={() => setCreating((v) => !v)}>
            {creating ? "Закрыть" : "+ Новый ключ"}
          </button>
        </div>
        {creating && <NewKey hub={hub} busy={busy} onCreate={(body) => call("keys", "POST", body)} />}
        {error && <p className="admin-error">{error}</p>}

        <div className="people-head">
          <span className="people-sort">
            {SORTS.map(([s, label]) => (
              <button key={s} type="button" className={`chip chip-small${sort === s ? " chip-on" : ""}`} onClick={() => setSort(s)}>
                {label}
              </button>
            ))}
          </span>
          <span className="people-cols">
            {SORTS.map(([s, label]) => (
              <span key={s} className={`people-col people-col-${s}`}>
                {label}
              </span>
            ))}
            <span className="people-chevron" />
          </span>
        </div>

        <ul className={`hub-list sort-${sort}`}>
          {used.map((p) => (
            <PersonRow key={p.main.id} p={p} open={open === p.main.id} onToggle={() => setOpen(open === p.main.id ? null : p.main.id)} {...rowProps} />
          ))}
        </ul>

        {idle.length > 0 && (
          <>
            <button type="button" className="linkbtn people-more" onClick={() => setShowIdle((v) => !v)}>
              {showIdle ? "Скрыть" : "Ещё"} {idle.length} без расходов {showIdle ? "▴" : "▾"}
            </button>
            {showIdle && (
              <ul className={`hub-list sort-${sort}`}>
                {idle.map((p) => (
                  <PersonRow key={p.main.id} p={p} open={open === p.main.id} onToggle={() => setOpen(open === p.main.id ? null : p.main.id)} {...rowProps} />
                ))}
              </ul>
            )}
          </>
        )}

        {revoked.length > 0 && (
          <>
            <button type="button" className="linkbtn people-more" onClick={() => setShowRevoked((v) => !v)}>
              Отозванные ({revoked.length}) {showRevoked ? "▴" : "▾"}
            </button>
            {showRevoked && (
              <ul className={`hub-list sort-${sort}`}>
                {revoked.map((p) => (
                  <PersonRow key={p.main.id} p={p} open={open === p.main.id} onToggle={() => setOpen(open === p.main.id ? null : p.main.id)} {...rowProps} />
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <p className="step-note">
        Claude — цена тех же токенов по тарифам API, только запросы через хаб; проценты лимита — по всему аккаунту, включая работу
        без хаба. Gemini — по минутам звука: диктовка $0.009 за минуту, файл $0.005. «7 дней» и «Сегодня» — по московскому времени.
      </p>
    </>
  );
}

function Stat({ label, claude, gemini }: { label: string; claude: number; gemini: number }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{money(claude + gemini)}</span>
      <span className="stat-sub">Claude {money(claude)}</span>
      <span className="stat-sub">Gemini {money(gemini)}</span>
    </div>
  );
}

const MSK = "Europe/Moscow";

function weekday(date: string) {
  return new Date(`${date}T12:00:00+03:00`).toLocaleDateString("ru-RU", { weekday: "short", timeZone: MSK });
}

function moment(ts: number) {
  return new Date(ts * 1000).toLocaleString("ru-RU", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: MSK,
  });
}

function time(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: MSK });
}

function mskDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("sv-SE", { timeZone: MSK });
}

/**
 * Part of the account weekly limit used each day of a week, each bar split by person color, with arrows to
 * past weeks. Bars share one scale across weeks; the dashed line is an even pace, 1/7 of the limit a day.
 * A click on a day lists who used how much that day.
 */
function WeekByDay({ people, weeks }: { people: Person[]; weeks: Week[] }) {
  // The week shown, by its reset time (null: the newest), so a new week arriving on refresh doesn't move it.
  const [reset, setReset] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const index = Math.max(0, weeks.findIndex((w) => w.reset === reset));
  const week = weeks[index];
  const now = Date.now() / 1000;
  const today = mskDate(now);

  const owner = new Map<number, Person>();
  for (const p of people) for (const k of p.keys) owner.set(k.id, p);
  const rows = (d: Week["days"][number]) => {
    const by = new Map<number, { id: number; name: string; color: string; share: number; cost: number }>();
    for (const k of d.keys) {
      const p = k.id === null ? undefined : owner.get(k.id);
      const id = p ? p.main.id : -1;
      const row = by.get(id) ?? { id, name: p ? p.main.name : "Удалённые ключи", color: p ? p.main.color : "var(--rest)", share: 0, cost: 0 };
      row.share += k.share;
      row.cost += k.cost;
      by.set(id, row);
    }
    return [...by.values()].sort((a, b) => b.share - a.share || b.cost - a.cost);
  };
  // Stack in the order of the people list, so a person's color keeps its place from day to day.
  const order = (id: number) => (id === -1 ? people.length : people.findIndex((p) => p.main.id === id));
  const total = (d: Week["days"][number]) => d.keys.reduce((s, k) => s + k.share, 0);
  const pace = 1 / 7;
  // Room above the tallest bar for its label.
  const scale = Math.max(pace, ...weeks.flatMap((w) => w.days.map(total))) * 1.2;

  const days = week.days;
  const todayIndex = days.findIndex((d) => d.date === today);
  const busiest = days.reduce((best, d, i) => (total(d) > total(days[best]) ? i : best), 0);
  const sel = picked !== null && picked < days.length ? picked : todayIndex >= 0 ? todayIndex : busiest;
  const go = (i: number) => {
    setReset(i === 0 ? null : weeks[i].reset);
    setPicked(null);
  };
  const who = rows(days[sel]).filter((r) => r.share > 0 || r.cost > 0);
  const current = week.reset > now;

  return (
    <div className="byday">
      <div className="weeknav">
        <button type="button" className="chip chip-small" disabled={index >= weeks.length - 1} onClick={() => go(index + 1)} aria-label="Неделя раньше">
          ‹
        </button>
        <span className="weeknav-label">
          <b>
            {shortDate(mskDate(week.start))} – {shortDate(mskDate(week.reset))}
          </b>
          <span className="admin-meta">
            {current ? "эта неделя" : "прошла"} · использовано <b className="weeknav-used">{week.utilization === null ? "нет данных" : pct(week.utilization)}</b>
          </span>
        </span>
        <button type="button" className="chip chip-small" disabled={index === 0} onClick={() => go(index - 1)} aria-label="Неделя позже">
          ›
        </button>
      </div>
      <div className="chart-bars byday-bars weekbars">
        <span className="weekbars-pace" style={{ bottom: `${(pace / scale) * 100}%` }} />
        {days.map((d, i) => {
          const t = total(d);
          return (
            <button
              key={d.date}
              type="button"
              className={`chart-col byday-col${i === sel ? " byday-col-on" : ""}${current && d.date > today ? " weekbars-future" : ""}`}
              onClick={() => setPicked(i)}
              title={`${shortDate(d.date)}: ${pct(t)} лимита`}
            >
              {t > 0 && <span className="weekbars-value">{pct(t)}</span>}
              <span className="byday-stack" style={{ height: `${(t / scale) * 100}%` }}>
                {rows(d).sort((a, b) => order(a.id) - order(b.id)).map((r) =>
                  r.share > 0 ? <i key={r.id} title={`${r.name}: ${pct(r.share)}`} style={{ flexGrow: r.share / t, background: r.color }} /> : null,
                )}
              </span>
            </button>
          );
        })}
      </div>
      <div className="weekbars-days">
        {days.map((d, i) => (
          <span key={d.date} className={i === sel ? "weekbars-day-on" : ""}>
            {weekday(d.date)}
            <br />
            {d.date.slice(8)}
            {i === 0 && time(week.start) !== "00:00" && <small>с {time(week.start)}</small>}
            {i === days.length - 1 && time(week.reset) !== "00:00" && <small>до {time(week.reset)}</small>}
          </span>
        ))}
      </div>
      <p className="admin-meta weekbars-note">
        Пунктир — ровный темп, {pct(pace)} лимита в день.
        <br />
        Сброс {moment(week.reset)}
        {week.baseline ? `; до хаба уже было ${pct(week.baseline)}` : ""}.
      </p>
      <div className="byday-list">
        <p className="byday-title">
          <span>
            {dayTitle(days[sel].date, today)}
          </span>
          <span>{pct(total(days[sel]))} лимита</span>
        </p>
        {who.length === 0 ? (
          <p className="admin-meta">{current && days[sel].date > today ? "Этот день ещё впереди." : "Хаб не видел запросов."}</p>
        ) : (
          <ul className="split">
            {who.map((r) => (
              <li key={r.id}>
                <span>
                  <i className="dot" style={{ background: r.color }} />
                  {r.name}
                </span>
                <span>
                  {pct(r.share)} <span className="admin-meta">· {money(r.cost)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function dayTitle(date: string, today: string) {
  return date === today ? "Сегодня" : `${weekday(date)}, ${shortDate(date)}`;
}

const SERVICES = [
  ["claude", "Claude"],
  ["gemini", "Gemini"],
  ["blancvpn", "BlancVPN"],
] as const;

function NewKey({
  hub,
  busy,
  onCreate,
}: {
  hub: string;
  busy: boolean;
  onCreate: (body: Record<string, unknown>) => Promise<unknown>;
}) {
  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [access, setAccess] = useState({ claude: true, gemini: false, blancvpn: false });
  const [created, setCreated] = useState<{ name: string; key: string; access: typeof access } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    const res = await onCreate({ name: clean, telegram: telegram.trim(), ...access });
    if (res) {
      setName("");
      setTelegram("");
      setCreated({ ...(res as { name: string; key: string }), access });
    }
  }

  return (
    <div className="new-key">
      <form className="admin-create" onSubmit={submit}>
        <input
          className="gate-input"
          type="text"
          placeholder="Имя, машина или агент"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />
        <input
          className="gate-input"
          type="text"
          placeholder="Telegram: @username"
          value={telegram}
          onChange={(e) => setTelegram(e.target.value)}
          disabled={busy}
        />
        <div className="access">
          {SERVICES.map(([service, label]) => (
            <label key={service}>
              <input
                type="checkbox"
                checked={access[service]}
                onChange={(e) => setAccess({ ...access, [service]: e.target.checked })}
                disabled={busy}
              />
              {label}
            </label>
          ))}
        </div>
        <button className="btn btn-dark" type="submit" disabled={busy || !name.trim()}>
          Выпустить
        </button>
      </form>
      {created && (
        <div className="latest latest-claude">
          <p className="latest-label">Ключ для {created.name}</p>
          <p className="step-note">Личная ссылка: вход на сайт, лимиты, расход и инструкция.</p>
          <div className="admin-link">{keyPageUrl(origin(), created.key, created.access)}</div>
          <div className="latest-meta">
            <CopyButton value={keyPageUrl(origin(), created.key, created.access)} label="Копировать ссылку" />
            <CopyButton value={setupCommand(hub, created.key)} label="Копировать команду установки" />
          </div>
        </div>
      )}
    </div>
  );
}

interface RowProps {
  hub: string;
  busy: boolean;
  /** Main keys of all people, for "whose key". */
  mains: Key[];
  onUpdate: (k: Key, fields: Record<string, unknown>) => Promise<unknown>;
  onAct: (k: Key, action: "revoke" | "restore" | "delete") => void;
}

function PersonRow({ p, open, onToggle, ...props }: RowProps & { p: Person; open: boolean; onToggle: () => void }) {
  const { main, spend } = p;
  const revoked = isRevoked(p);
  const meta = [
    main.telegram && `@${main.telegram}`,
    revoked ? `отозван ${when(main.revoked_at)}` : ago(spend.last),
    p.keys.length > 1 && `${p.keys.length} ${p.keys.length < 5 ? "ключа" : "ключей"}`,
  ].filter(Boolean);
  return (
    <li className={`hub-row${revoked ? " admin-row-revoked" : ""}${open ? " hub-row-open" : ""}`}>
      <button type="button" className="hub-row-head person-head" onClick={onToggle} aria-expanded={open}>
        <Avatar name={main.name} telegram={main.telegram ?? undefined} color={main.color} />
        <span className="hub-row-name">
          <span className="admin-name">{main.name}</span>
          <span className="admin-meta">{meta.join(" · ")}</span>
        </span>
        <span className="badges">
          {SERVICES.map(([s, label]) => (
            <span key={s} className={`badge${p.keys.some((k) => !k.revoked_at && k[s]) ? " badge-on" : ""}`}>
              {label}
            </span>
          ))}
        </span>
        <span className="people-cols">
          <span className="people-col people-col-today">{money(spend.today)}</span>
          <span className="people-col people-col-days7">
            {money(spend.days7)}
            {spend.weekLimit > 0 && <span className="admin-meta">{pct(spend.weekLimit)} лимита</span>}
          </span>
          <span className="people-col people-col-total">{money(spend.total)}</span>
          <span className="people-chevron" aria-hidden>
            ›
          </span>
        </span>
      </button>
      {open && (
        <div className="hub-row-body">
          <div className="person-summary">
            <div className="stats">
              <div className="stat">
                <span className="stat-label">Claude, всё время</span>
                <span className="stat-value">{money(spend.claudeTotal)}</span>
                <span className="stat-sub">{p.keys.reduce((s, k) => s + k.total.requests, 0).toLocaleString("ru-RU")} запр.</span>
              </div>
              <div className="stat">
                <span className="stat-label">Gemini, всё время</span>
                <span className="stat-value">{money(spend.geminiTotal)}</span>
                <span className="stat-sub">{minutes(spend.minutes)}</span>
              </div>
            </div>
            <DailyChart daily={fromFirstSpend(spend.daily, (d) => d.cost)} />
          </div>
          {p.keys.map((k) => (
            <KeyCard key={k.id} k={k} person={p} {...props} />
          ))}
        </div>
      )}
    </li>
  );
}

/** Text field that saves on Enter or when it loses focus. */
function InlineInput({
  value,
  placeholder,
  disabled,
  onCommit,
}: {
  value: string;
  placeholder?: string;
  disabled: boolean;
  onCommit: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    if (draft.trim() !== value) onCommit(draft.trim());
  };
  return (
    <input
      className="gate-input inline-input"
      value={draft}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setDraft(value);
      }}
    />
  );
}

/** Color input that saves once the picker settles, not on every move. */
function ColorPick({ value, disabled, onCommit }: { value: string; disabled: boolean; onCommit: (c: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (draft === value) return;
    const t = window.setTimeout(() => onCommit(draft), 600);
    return () => window.clearTimeout(t);
  }, [draft, value, onCommit]);
  return <input type="color" value={draft} disabled={disabled} onChange={(e) => setDraft(e.target.value)} />;
}

function KeyCard({ k, person, hub, busy, mains, onUpdate, onAct }: RowProps & { k: Key; person: Person }) {
  const own = spendOf([k]);
  const isMain = k.id === person.main.id;
  const hasKeys = isMain && person.keys.length > 1;
  const owners = mains.filter((m) => m.id !== k.id);
  const onColor = useCallback((c: string) => onUpdate(k, { color: c }), [k, onUpdate]);
  return (
    <div className="key-card">
      <div className="key-card-head">
        <span className="key-card-title">
          {person.keys.length > 1 && <Avatar name={k.name} telegram={k.telegram ?? undefined} color={k.color} size={22} />}
          <span className="admin-meta">
            {k.key_hint} · создан {when(k.created_at)}
            {k.admin && " · админ"}
            {k.revoked_at && ` · отозван ${when(k.revoked_at)}`}
          </span>
        </span>
        {person.keys.length > 1 && (
          <span className="admin-meta">
            {money(own.total)} всего · {money(own.days7)} за 7 дней
          </span>
        )}
      </div>
      <div className="key-fields">
        <label>
          <span>Имя</span>
          <InlineInput value={k.name} disabled={busy} onCommit={(v) => v && onUpdate(k, { name: v })} />
        </label>
        <label>
          <span>Telegram</span>
          <InlineInput value={k.telegram ? `@${k.telegram}` : ""} placeholder="@username" disabled={busy} onCommit={(v) => onUpdate(k, { telegram: v })} />
        </label>
        {!hasKeys && !k.revoked_at && (
          <label>
            <span>Чей ключ</span>
            <select
              className="gate-input inline-input"
              value={k.owner ?? ""}
              disabled={busy}
              onChange={(e) => onUpdate(k, { owner: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Отдельный человек</option>
              {owners.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="access">
        <label>
          <ColorPick value={k.color} disabled={busy} onCommit={onColor} />
          Цвет
        </label>
        {SERVICES.map(([service, label]) => (
          <label key={service}>
            <input type="checkbox" checked={k[service]} disabled={busy} onChange={(e) => onUpdate(k, { [service]: e.target.checked })} />
            {label}
          </label>
        ))}
      </div>
      <ModelList models={k.models} />
      <div className="hub-actions">
        {!k.revoked_at && (
          <>
            <CopyButton value={keyPageUrl(origin(), k.key, k)} label="Ссылка" />
            <CopyButton value={setupCommand(hub, k.key)} label="Команда установки" />
            <CopyButton value={usageCommand(hub, k.key)} label="Команда расхода" />
            <CopyButton value={k.key} label="Ключ" />
          </>
        )}
        <span className="hub-actions-end">
          {k.revoked_at ? (
            <>
              <button className="linkbtn" disabled={busy} onClick={() => onAct(k, "restore")}>
                Вернуть
              </button>
              <button className="linkbtn linkbtn-danger" disabled={busy} onClick={() => onAct(k, "delete")}>
                Удалить
              </button>
            </>
          ) : (
            <button className="linkbtn linkbtn-danger" disabled={busy} onClick={() => onAct(k, "revoke")}>
              Отозвать
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
