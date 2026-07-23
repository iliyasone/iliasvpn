"use client";

import { useEffect, useState, type FormEvent } from "react";

const HANDLE_KEY = "visitor_tg";
const PING_EVERY_MS = 10 * 60 * 1000;

function pingKey(page: string): string {
  return `visit_ping_${page}`;
}

function sendVisit(handle: string, page: string, firstVisit: boolean) {
  localStorage.setItem(pingKey(page), String(Date.now()));
  fetch("/api/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle, page, firstVisit }),
    keepalive: true,
  }).catch(() => {});
}

export function VisitorGate({ page }: { page: "claude" | "blancvpn" }) {
  const [ask, setAsk] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    const handle = localStorage.getItem(HANDLE_KEY);
    if (!handle) {
      setAsk(true);
      return;
    }
    const last = Number(localStorage.getItem(pingKey(page)) ?? 0);
    if (Date.now() - last > PING_EVERY_MS) sendVisit(handle, page, false);
  }, [page]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const handle = value.replace(/\s+/g, " ").trim().slice(0, 64);
    if (handle.length < 2) return;
    localStorage.setItem(HANDLE_KEY, handle);
    sendVisit(handle, page, true);
    setAsk(false);
  }

  if (!ask) return null;

  return (
    <div className="gate-overlay">
      <form className="gate-card" onSubmit={submit}>
        <p className="gate-title">Привет! Кто здесь?</p>
        <p className="gate-note">
          Напишите ваш Telegram — или того, кто поделился с вами этой ссылкой.
        </p>
        <input
          className="gate-input"
          type="text"
          placeholder="@username"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          className="btn btn-dark gate-submit"
          type="submit"
          disabled={value.trim().length < 2}
        >
          Продолжить →
        </button>
      </form>
    </div>
  );
}
