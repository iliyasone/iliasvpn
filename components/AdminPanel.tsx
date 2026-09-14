"use client";

import { useState, type FormEvent } from "react";
import type { AccessEntry, AccessTokens } from "@/lib/access";
import { CopyButton } from "./CopyButton";

function inviteUrl(token: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/?k=${token}`;
}

function fmt(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminPanel({
  initialTokens,
  writable,
}: {
  initialTokens: AccessTokens;
  writable: boolean;
}) {
  const [tokens, setTokens] = useState<AccessTokens>(initialTokens);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/tokens", { cache: "no-store" });
    if (res.ok) setTokens((await res.json()).tokens);
  }

  async function call(init: RequestInit): Promise<Response | null> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tokens", {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `Ошибка ${res.status}`);
        return null;
      }
      return res;
    } finally {
      setBusy(false);
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    const res = await call({ method: "POST", body: JSON.stringify({ name: clean }) });
    if (!res) return;
    const { token } = (await res.json()) as { token: string };
    setName("");
    setCreated(token);
    await refresh();
  }

  async function act(token: string, action: "revoke" | "restore" | "delete") {
    if (action === "delete" && !confirm("Удалить запись совсем?")) return;
    const res = await call({ method: "PATCH", body: JSON.stringify({ token, action }) });
    if (res) await refresh();
  }

  const rows = Object.entries(tokens).sort(
    ([, a], [, b]) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );

  return (
    <>
      <section className="section">
        <h2 className="section-title">Новое приглашение</h2>
        {!writable && (
          <p className="admin-error">
            VERCEL_API_TOKEN не задан — можно только смотреть список.
          </p>
        )}
        <form className="admin-create" onSubmit={create}>
          <input
            className="gate-input"
            type="text"
            placeholder="Имя (кому даёшь ссылку)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy || !writable}
          />
          <button
            className="btn btn-dark"
            type="submit"
            disabled={busy || !writable || name.trim().length < 1}
          >
            Создать ссылку
          </button>
        </form>
        {error && <p className="admin-error">{error}</p>}
        {created && tokens[created] && (
          <div className="latest latest-claude">
            <p className="latest-label">Ссылка для {tokens[created].name}</p>
            <div className="admin-link">{inviteUrl(created)}</div>
            <div className="latest-meta">
              <CopyButton value={inviteUrl(created)} label="Копировать ссылку" />
            </div>
          </div>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">Люди ({rows.length})</h2>
        {rows.length === 0 && <p className="step-note">Пока никого.</p>}
        <ul className="admin-list">
          {rows.map(([token, entry]) => (
            <AdminRow
              key={token}
              token={token}
              entry={entry}
              busy={busy || !writable}
              onAct={act}
            />
          ))}
        </ul>
      </section>
    </>
  );
}

function AdminRow({
  token,
  entry,
  busy,
  onAct,
}: {
  token: string;
  entry: AccessEntry;
  busy: boolean;
  onAct: (token: string, action: "revoke" | "restore" | "delete") => void;
}) {
  const revoked = Boolean(entry.revokedAt);
  return (
    <li className={`admin-row${revoked ? " admin-row-revoked" : ""}`}>
      <div className="admin-row-main">
        <span className="admin-name">{entry.name}</span>
        {revoked && <span className="admin-badge">отозван</span>}
        <span className="admin-meta">
          создан {fmt(entry.createdAt)} · был {fmt(entry.lastSeenAt)}
          {entry.lastSeenFrom ? ` · ${entry.lastSeenFrom}` : ""}
        </span>
      </div>
      <div className="admin-row-actions">
        <CopyButton value={inviteUrl(token)} label="Ссылка" />
        {revoked ? (
          <>
            <button className="linkbtn" disabled={busy} onClick={() => onAct(token, "restore")}>
              Вернуть
            </button>
            <button className="linkbtn" disabled={busy} onClick={() => onAct(token, "delete")}>
              Удалить
            </button>
          </>
        ) : (
          <button className="linkbtn" disabled={busy} onClick={() => onAct(token, "revoke")}>
            Отозвать
          </button>
        )}
      </div>
    </li>
  );
}
