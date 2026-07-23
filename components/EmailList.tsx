"use client";

import { useState } from "react";
import type { FetchStatus } from "./useMessages";
import type { MailMessage } from "@/lib/types";
import { RelativeTime } from "./RelativeTime";
import { EmailViewer } from "./EmailViewer";
import { loginClientLabel } from "@/lib/extract";

export function EmailList({
  messages,
  status,
  emptyText,
}: {
  messages: MailMessage[];
  status: FetchStatus;
  emptyText: string;
}) {
  if (status === "not-configured") {
    return (
      <p className="list-empty">Почта не настроена — EMAIL, EMAIL_PASSWORD, IMAP.</p>
    );
  }
  if (messages.length === 0) {
    return (
      <p className="list-empty">
        {status === "loading" ? "Загрузка…" : emptyText}
      </p>
    );
  }
  return (
    <div className="list">
      {messages.map((m) => (
        <Row key={`${m.category}-${m.uid}`} message={m} />
      ))}
    </div>
  );
}

function Row({ message }: { message: MailMessage }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="row">
      <button
        type="button"
        className="row-head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {message.category === "news" && <span className="row-tag">Новости</span>}
        {message.loginClient && (
          <span className="row-tag row-tag-client">
            {loginClientLabel(message.loginClient)}
          </span>
        )}
        <span className="row-subject">{message.subject || "(без темы)"}</span>
        <span className="row-date">
          <RelativeTime iso={message.date} />
        </span>
      </button>
      {open && (
        <div className="row-body">
          <EmailViewer category={message.category} uid={message.uid} />
        </div>
      )}
    </div>
  );
}
