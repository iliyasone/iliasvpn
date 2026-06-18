"use client";

import { useEffect, useRef } from "react";
import { useMessages } from "./useMessages";
import { CopyButton } from "./CopyButton";
import { RelativeTime } from "./RelativeTime";
import { EmailRow } from "./EmailRow";
import { LiveStatus } from "./LiveStatus";
import { ConfigNotice } from "./ConfigNotice";
import { playChime } from "@/lib/chime";

export function BlancVpnMessages() {
  const { messages, status, error, lastUpdated, newUids } =
    useMessages("blancvpn");
  const latest = messages[0];
  const chimedFor = useRef<number | null>(null);

  // Chime once when a brand-new code lands at the top.
  useEffect(() => {
    if (latest && newUids.has(latest.uid) && chimedFor.current !== latest.uid) {
      chimedFor.current = latest.uid;
      playChime();
    }
  }, [latest, newUids]);

  if (status === "not-configured") return <ConfigNotice />;

  return (
    <div className="messages">
      {latest?.code ? (
        <div
          className={`code-hero ${newUids.has(latest.uid) ? "code-hero-new" : ""}`}
        >
          <span className="code-hero-label">Ваш код BlancVPN</span>
          <span className="code-hero-value">{latest.code}</span>
          <div className="code-hero-foot">
            <span>
              получен <RelativeTime iso={latest.date} />
            </span>
            <CopyButton value={latest.code} label="Скопировать код" />
          </div>
        </div>
      ) : (
        <div className="waiting">
          <span className="waiting-spinner" aria-hidden />
          <p>
            Код ещё не пришёл. Запросите код в приложении BlancVPN — он появится
            здесь автоматически.
          </p>
          {status === "error" && error && (
            <p className="waiting-error">{error}</p>
          )}
        </div>
      )}

      {messages.length > 1 && (
        <section className="history">
          <h3 className="history-title">Прошлые коды</h3>
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
