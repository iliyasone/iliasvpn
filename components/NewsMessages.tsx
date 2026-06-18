"use client";

import { useMessages } from "./useMessages";
import { EmailRow } from "./EmailRow";
import { ConfigNotice } from "./ConfigNotice";

export function NewsMessages() {
  // News updates rarely — poll gently.
  const { messages, status, newUids } = useMessages("news", 60_000);

  if (status === "not-configured") return <ConfigNotice />;

  if (messages.length === 0) {
    return (
      <p className="news-empty">
        {status === "loading" ? "Загрузка…" : "Новостей пока нет."}
      </p>
    );
  }

  return (
    <ul className="email-list">
      {messages.map((m) => (
        <EmailRow key={m.uid} message={m} isNew={newUids.has(m.uid)} />
      ))}
    </ul>
  );
}
