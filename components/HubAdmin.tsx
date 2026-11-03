"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Avatar } from "./Avatar";
import { CopyButton } from "./CopyButton";
import {
  DailyChart,
  GeminiStats,
  LimitBars,
  WeekBar,
  ModelList,
  StatRow,
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

interface Key {
  id: number;
  name: string;
  telegram: string | null;
  color: string;
  claude: boolean;
  gemini: boolean;
  blancvpn: boolean;
  admin: boolean;
  key: string;
  key_hint: string;
  created_at: number;
  revoked_at: number | null;
  today: Totals;
  week: Totals;
  total: Totals;
  daily: { date: string; cost: number }[];
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
  week: Totals;
  today: Totals;
  daily: { date: string; cost: number }[];
  gemini: GeminiUsage;
}

function origin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

export function HubAdmin({ hub }: { hub: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [access, setAccess] = useState({ claude: true, gemini: false, blancvpn: false });
  const [created, setCreated] = useState<{ name: string; key: string } | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/hub/admin/keys", { cache: "no-store" }).catch(() => null);
    if (!res) return setError("Сайт не отвечает.");
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return setError(body.error ?? `Ошибка ${res.status}`);
    setError(null);
    setData(body as Overview);
  }, []);

  useEffect(() => {
    load();
    const t = window.setInterval(load, 30_000);
    return () => window.clearInterval(t);
  }, [load]);

  async function call(path: string, method: string, body?: unknown) {
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
      await load();
      return json;
    } finally {
      setBusy(false);
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    const res = await call("keys", "POST", { name: clean, telegram: telegram.trim(), ...access });
    if (res) {
      setName("");
      setTelegram("");
      setCreated(res as { name: string; key: string });
    }
  }

  async function act(k: Key, action: Action, value?: unknown) {
    if (action === "delete" && !confirm(`Удалить ключ «${k.name}»? Статистика по нему останется без имени.`)) return;
    if (action === "rename") {
      const next = prompt("Новое имя", k.name)?.trim();
      if (!next || next === k.name) return;
      return call(`keys/${k.id}/update`, "POST", { name: next });
    }
    if (action === "telegram") {
      const next = prompt("Telegram (@username или ссылка t.me/…), пусто — убрать", k.telegram ?? "");
      if (next === null) return;
      return call(`keys/${k.id}/update`, "POST", { telegram: next.trim() });
    }
    if (action === "color" || action === "claude" || action === "gemini" || action === "blancvpn") {
      return call(`keys/${k.id}/update`, "POST", { [action]: value });
    }
    if (action === "delete") return call(`keys/${k.id}`, "DELETE");
    return call(`keys/${k.id}/${action}`, "POST");
  }

  if (!data) {
    return <p className={error ? "admin-error" : "step-note"}>{error ?? "Загружаю…"}</p>;
  }

  const active = data.keys.filter((k) => !k.revoked_at);
  const revoked = data.keys.filter((k) => k.revoked_at);

  return (
    <>
      <section className="section">
        <h2 className="section-title">Аккаунт</h2>
        <WeekBar
          limits={data.limits}
          segments={data.keys.filter((k) => k.week_limit > 0).map((k) => ({ label: k.name, color: k.color, value: k.week_limit }))}
          restLabel={data.week_baseline === null ? "Без хаба" : "До хаба и мимо него"}
        />
        <LimitBars limits={data.limits} />
        <StatRow today={data.today} week={data.week} />
        <DailyChart daily={data.daily} />
        <p className="step-note">
          Доллары — цена тех же токенов по тарифам API, считаются только запросы через хаб. Проценты лимита —
          по всему аккаунту, включая работу без хаба.
        </p>
      </section>

      <GeminiSection keys={data.keys} total={data.gemini} />

      <section className="section">
        <h2 className="section-title">Новый ключ</h2>
        <form className="admin-create" onSubmit={create}>
          <input
            className="gate-input"
            type="text"
            placeholder="Машина или агент, например vm-2"
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
        {error && <p className="admin-error">{error}</p>}
        {created && (
          <div className="latest latest-claude">
            <p className="latest-label">Ключ для {created.name}</p>
            <p className="step-note">Личная ссылка: вход на сайт, лимиты, расход и инструкция.</p>
            <div className="admin-link">{keyPageUrl(origin(), created.key, access)}</div>
            <div className="latest-meta">
              <CopyButton value={keyPageUrl(origin(), created.key, access)} label="Копировать ссылку" />
              <CopyButton value={setupCommand(hub, created.key)} label="Копировать команду установки" />
            </div>
          </div>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">Ключи ({active.length})</h2>
        {active.length === 0 && <p className="step-note">Пока ни одного.</p>}
        <ul className="hub-list">
          {active.map((k) => (
            <KeyRow key={k.id} hub={hub} k={k} open={open === k.id} busy={busy} onToggle={() => setOpen(open === k.id ? null : k.id)} onAct={act} />
          ))}
        </ul>
      </section>

      {revoked.length > 0 && (
        <section className="section">
          <h2 className="section-title">Отозванные ({revoked.length})</h2>
          <ul className="hub-list">
            {revoked.map((k) => (
              <KeyRow key={k.id} hub={hub} k={k} open={open === k.id} busy={busy} onToggle={() => setOpen(open === k.id ? null : k.id)} onAct={act} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

type Action = "revoke" | "restore" | "delete" | "rename" | "telegram" | "color" | "claude" | "gemini" | "blancvpn";

const SERVICES = [
  ["claude", "Claude"],
  ["gemini", "Gemini"],
  ["blancvpn", "BlancVPN"],
] as const;

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

function KeyRow({
  hub,
  k,
  open,
  busy,
  onToggle,
  onAct,
}: {
  hub: string;
  k: Key;
  open: boolean;
  busy: boolean;
  onToggle: () => void;
  onAct: (k: Key, action: Action, value?: unknown) => void;
}) {
  return (
    <li className={`hub-row${k.revoked_at ? " admin-row-revoked" : ""}${open ? " hub-row-open" : ""}`}>
      <button type="button" className="hub-row-head" onClick={onToggle} aria-expanded={open}>
        <Avatar name={k.name} telegram={k.telegram ?? undefined} color={k.color} />
        <span className="hub-row-name">
          <span className="admin-name">{k.name}</span>
          <span className="admin-meta">{k.revoked_at ? `отозван ${when(k.revoked_at)}` : ago(k.total.last_used_at)}</span>
        </span>
        <span className="hub-row-cost">
          <span>≈{pct(k.week_limit)}</span>
          <span className="admin-meta">{money(k.week.cost)} за неделю</span>
        </span>
      </button>
      {open && (
        <div className="hub-row-body">
          <StatRow today={k.today} week={k.week} total={k.total} />
          <DailyChart daily={k.daily} />
          <ModelList models={k.models} />
          {(k.gemini || k.gemini_usage.total.requests > 0) && (
            <p className="admin-meta">
              Gemini: {money(k.gemini_usage.month.cost)} за 30 дней · {minutes(k.gemini_usage.month.minutes)} ·{" "}
              {ago(k.gemini_usage.total.last_used_at)}
            </p>
          )}
          <p className="admin-meta">
            {k.key_hint} · создан {when(k.created_at)}
            {k.admin && " · админ"}
          </p>
          <div className="access">
            <label>
              <ColorPick value={k.color} disabled={busy} onCommit={(c) => onAct(k, "color", c)} />
              Цвет
            </label>
            {SERVICES.map(([service, label]) => (
              <label key={service}>
                <input
                  type="checkbox"
                  checked={k[service]}
                  disabled={busy}
                  onChange={(e) => onAct(k, service, e.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="hub-actions">
            {!k.revoked_at && (
              <>
                <CopyButton value={keyPageUrl(origin(), k.key, k)} label="Ссылка" />
                <CopyButton value={setupCommand(hub, k.key)} label="Команда установки" />
                <CopyButton value={usageCommand(hub, k.key)} label="Команда расхода" />
                <CopyButton value={k.key} label="Ключ" />
              </>
            )}
            <button className="linkbtn" disabled={busy} onClick={() => onAct(k, "rename")}>
              Переименовать
            </button>
            <button className="linkbtn" disabled={busy} onClick={() => onAct(k, "telegram")}>
              {k.telegram ? `@${k.telegram}` : "Telegram"}
            </button>
            {k.revoked_at ? (
              <>
                <button className="linkbtn" disabled={busy} onClick={() => onAct(k, "restore")}>
                  Вернуть
                </button>
                <button className="linkbtn" disabled={busy} onClick={() => onAct(k, "delete")}>
                  Удалить
                </button>
              </>
            ) : (
              <button className="linkbtn" disabled={busy} onClick={() => onAct(k, "revoke")}>
                Отозвать
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

/** Gemini through the shared Google key: the total, then who spent how much over 30 days. */
function GeminiSection({ keys, total }: { keys: Key[]; total: GeminiUsage }) {
  const users = keys
    .filter((k) => k.gemini || k.gemini_usage.total.requests > 0)
    .sort((a, b) => b.gemini_usage.month.cost - a.gemini_usage.month.cost || a.name.localeCompare(b.name));
  const max = Math.max(...users.map((k) => k.gemini_usage.month.cost), 0);
  return (
    <section className="section">
      <h2 className="section-title">Gemini · Ciao</h2>
      <GeminiStats usage={total} />
      {users.length === 0 ? (
        <p className="step-note">Ни у одного ключа нет Gemini: включите его в карточке ключа.</p>
      ) : (
        <ul className="gemini-users">
          {users.map((k) => {
            const m = k.gemini_usage.month;
            return (
              <li key={k.id}>
                <Avatar name={k.name} telegram={k.telegram ?? undefined} color={k.color} />
                <span className="gemini-user">
                  <span className="gemini-user-head">
                    <span className="admin-name">{k.name}</span>
                    <span>{money(m.cost)}</span>
                  </span>
                  <span className="gemini-bar">
                    <i style={{ width: max > 0 ? `${(m.cost / max) * 100}%` : 0, background: k.color }} />
                  </span>
                  <span className="admin-meta">
                    {minutes(m.minutes)} за 30 дней · {ago(k.gemini_usage.total.last_used_at)}
                    {!k.gemini && " · доступ выключен"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="step-note">Оценка по минутам звука: диктовка — $0.009 за минуту, файл — $0.005.</p>
    </section>
  );
}
