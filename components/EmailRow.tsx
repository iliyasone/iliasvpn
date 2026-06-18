"use client";

import { useState } from "react";
import type { MailMessage } from "@/lib/types";
import { RelativeTime } from "./RelativeTime";
import { EmailViewer } from "./EmailViewer";

export function EmailRow({
  message,
  isNew,
}: {
  message: MailMessage;
  isNew: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className={`email-row ${isNew ? "email-row-new" : ""}`}>
      <button
        type="button"
        className="email-row-head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="email-row-main">
          <span className="email-subject">
            {message.code && <span className="email-code-tag">{message.code}</span>}
            {message.subject || "(без темы)"}
          </span>
          <span className="email-meta">
            {message.fromName} · <RelativeTime iso={message.date} />
          </span>
        </span>
        {isNew && <span className="pill pill-new">новое</span>}
        <span className={`chevron ${open ? "chevron-open" : ""}`} aria-hidden>
          ⌄
        </span>
      </button>
      {open && (
        <div className="email-row-body">
          <EmailViewer category={message.category} uid={message.uid} />
        </div>
      )}
    </li>
  );
}
