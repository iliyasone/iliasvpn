"use client";

import { useEffect, useRef } from "react";
import { useMessages } from "./useMessages";
import { RelativeTime } from "./RelativeTime";
import { EmailRow } from "./EmailRow";
import { LiveStatus } from "./LiveStatus";
import { ConfigNotice } from "./ConfigNotice";
import { playChime } from "@/lib/chime";

export function ClaudeMessages() {
  const { messages, status, error, lastUpdated, newUids } =
    useMessages("claude");
  const latest = messages[0];
  const chimedFor = useRef<number | null>(null);

  useEffect(() => {
    if (latest && newUids.has(latest.uid) && chimedFor.current !== latest.uid) {
      chimedFor.current = latest.uid;
      playChime();
    }
  }, [latest, newUids]);

  if (status === "not-configured") return <ConfigNotice />;

  return (
    <div className="messages">
      {latest ? (
        <div
          className={`link-hero ${newUids.has(latest.uid) ? "link-hero-new" : ""}`}
        >
          <span className="link-hero-label">Безопасная ссылка для входа</span>
          <div className="link-hero-foot">
            <span>
              письмо получено <RelativeTime iso={latest.date} />
            </span>
            {latest.loginUrl ? (
              <a
                className="btn-primary"
                href={latest.loginUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Открыть ссылку входа →
              </a>
            ) : (
              <span className="link-hero-missing">
                Ссылка не распознана — откройте письмо ниже
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="waiting">
          <span className="waiting-spinner" aria-hidden />
          <p>
            Письмо ещё не пришло. Запросите ссылку на claude.ai — она появится
            здесь автоматически.
          </p>
          {status === "error" && error && (
            <p className="waiting-error">{error}</p>
          )}
        </div>
      )}

      {messages.length > 1 && (
        <section className="history">
          <h3 className="history-title">Прошлые письма входа</h3>
          <ul className="email-list">
            {messages.slice(1).map((m) => (
              <EmailRow key={m.uid} message={m} isNew={newUids.has(m.uid)} />
            ))}
          </ul>
        </section>
      )}

      <LiveStatus status={status} lastUpdated={lastUpdated} />
    </div>
  );
}
