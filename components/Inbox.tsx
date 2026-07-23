"use client";

import { useMessages } from "./useMessages";
import { CopyButton } from "./CopyButton";
import { RelativeTime } from "./RelativeTime";
import { EmailList } from "./EmailList";
import type { Category, MailMessage } from "@/lib/types";
import { loginClientLabel } from "@/lib/extract";

const RECENT_MS = 10 * 60 * 1000;

function isRecent(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < RECENT_MS;
}

export function Inbox({
  primary,
  also,
  kind,
  accent,
  emptyText,
}: {
  primary: Category;
  also?: Category;
  kind: "code" | "link";
  accent: "blanc" | "claude";
  emptyText: string;
}) {
  const main = useMessages(primary);
  const extra = useMessages(also ?? null, 30_000);

  const merged = [...main.messages, ...extra.messages].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  );

  const latest = main.messages[0];
  const value = kind === "code" ? latest?.code : latest?.loginUrl;
  const showLatest = Boolean(latest && value && isRecent(latest.date));

  return (
    <div>
      {showLatest && latest && kind === "code" && (
        <LatestCode key={latest.uid} message={latest} accent={accent} />
      )}
      {showLatest && latest && kind === "link" && (
        <LatestLink key={latest.uid} message={latest} accent={accent} />
      )}
      <EmailList messages={merged} status={main.status} emptyText={emptyText} />
    </div>
  );
}

function LatestCode({
  message,
  accent,
}: {
  message: MailMessage;
  accent: string;
}) {
  return (
    <div className={`latest latest-${accent}`}>
      <p className="latest-label">Код подтверждения</p>
      <div className="latest-code">{message.code}</div>
      <div className="latest-meta">
        <RelativeTime iso={message.date} />
        <CopyButton value={message.code ?? ""} label="Копировать код" />
      </div>
    </div>
  );
}

function LatestLink({
  message,
  accent,
}: {
  message: MailMessage;
  accent: string;
}) {
  return (
    <div className={`latest latest-${accent}`}>
      <p className="latest-label">
        Безопасная ссылка для входа
        {message.loginClient && (
          <span className="client-badge">
            {loginClientLabel(message.loginClient)}
          </span>
        )}
      </p>
      <a
        className="btn btn-dark"
        href={message.loginUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Открыть ссылку →
      </a>
      <div className="latest-meta">
        <RelativeTime iso={message.date} />
      </div>
    </div>
  );
}
