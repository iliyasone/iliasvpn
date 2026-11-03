"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CopyButton } from "./CopyButton";
import {
  DailyChart,
  LimitBars,
  ModelList,
  StatRow,
  ago,
  money,
  pct,
  when,
  type Limit,
  type Totals,
} from "./HubUsage";
import { keyPageUrl, setupCommand, usageCommand } from "@/lib/hub-setup";

interface Key {
  id: number;
  name: string;
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
}

interface Overview {
  keys: Key[];
  limits: Limit[];
  week_baseline: number | null;
  week: Totals;
  today: Totals;
  daily: { date: string; cost: number }[];
}

function origin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

export function HubAdmin({ hub }: { hub: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
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
    const res = await call("keys", "POST", { name: clean });
    if (res) {
      setName("");
      setCreated(res as { name: string; key: string });
    }
  }

  async function act(k: Key, action: "revoke" | "restore" | "delete" | "rename") {
    if (action === "delete" && !confirm(`Удалить ключ «${k.name}»? Статистика по нему останется без имени.`)) return;
    if (action === "rename") {
      const next = prompt("Новое имя", k.name)?.trim();
      if (!next || next === k.name) return;
      return call(`keys/${k.id}/rename`, "POST", { name: next });
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
        <LimitBars limits={data.limits} />
        <LimitSplit data={data} />
        <StatRow today={data.today} week={data.week} />
        <DailyChart daily={data.daily} />
        <p className="step-note">
          Доллары — цена тех же токенов по тарифам API, считаются только запросы через хаб. Проценты лимита —
          по всему аккаунту, включая работу без хаба.
        </p>
      </section>

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
          <button className="btn btn-dark" type="submit" disabled={busy || !name.trim()}>
            Выпустить
          </button>
        </form>
        {error && <p className="admin-error">{error}</p>}
        {created && (
          <div className="latest latest-claude">
            <p className="latest-label">Ключ для {created.name}</p>
            <p className="step-note">Ссылка на страницу ключа: инструкция и расход.</p>
            <div className="admin-link">{keyPageUrl(origin(), created.key)}</div>
            <div className="latest-meta">
              <CopyButton value={keyPageUrl(origin(), created.key)} label="Копировать ссылку" />
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

/** How this week's limit splits: per key through the hub, and the rest (before the hub or around it). */
function LimitSplit({ data }: { data: Overview }) {
  const total = data.limits.find((l) => l.window === "7d")?.utilization;
  if (total === undefined) return null;
  const keys = data.keys.filter((k) => k.week_limit > 0).sort((a, b) => b.week_limit - a.week_limit);
  const viaHub = keys.reduce((s, k) => s + k.week_limit, 0);
  return (
    <ul className="split">
      {keys.map((k) => (
        <li key={k.id}>
          <span>{k.name}</span>
          <span>≈{pct(k.week_limit)}</span>
        </li>
      ))}
      <li className="split-rest">
        <span>{data.week_baseline === null ? "Без хаба" : "До хаба и мимо него"}</span>
        <span>{pct(Math.max(0, total - viaHub))}</span>
      </li>
    </ul>
  );
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
  onAct: (k: Key, action: "revoke" | "restore" | "delete" | "rename") => void;
}) {
  return (
    <li className={`hub-row${k.revoked_at ? " admin-row-revoked" : ""}${open ? " hub-row-open" : ""}`}>
      <button type="button" className="hub-row-head" onClick={onToggle} aria-expanded={open}>
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
          <p className="admin-meta">
            {k.key_hint} · создан {when(k.created_at)}
          </p>
          <div className="hub-actions">
            {!k.revoked_at && (
              <>
                <CopyButton value={keyPageUrl(origin(), k.key)} label="Ссылка" />
                <CopyButton value={setupCommand(hub, k.key)} label="Команда установки" />
                <CopyButton value={usageCommand(hub, k.key)} label="Команда расхода" />
                <CopyButton value={k.key} label="Ключ" />
              </>
            )}
            <button className="linkbtn" disabled={busy} onClick={() => onAct(k, "rename")}>
              Переименовать
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
