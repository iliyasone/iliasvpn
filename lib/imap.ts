import "server-only";
import {
  ImapFlow,
  type FetchMessageObject,
  type SearchObject,
} from "imapflow";
import { simpleParser } from "mailparser";
import { getImapConfig } from "./config";
import {
  extractClaudeLoginUrl,
  extractLoginClient,
  extractLoginCode,
  snippet,
} from "./extract";
import type { Category, FullMail, MailMessage } from "./types";

export { CATEGORIES, isCategory } from "./types";
export type { Category, FullMail, MailMessage } from "./types";

export class ImapConfigError extends Error {
  constructor() {
    super(
      "IMAP is not configured. Set EMAIL, EMAIL_PASSWORD and IMAP env vars.",
    );
    this.name = "ImapConfigError";
  }
}

interface SearchDef {
  from: string;
  subject?: string;
  needsBody: boolean;
  matches: (fromAddress: string) => boolean;
}

const SEARCH: Record<Category, SearchDef> = {
  claude: {
    from: "mail.anthropic.com",
    // IMAP SUBJECT is a case-insensitive substring match; this covers both the
    // old "Secure link to log in to Claude.ai" and the new (since 2026-07)
    // "Your secure link to Claude.ai is here" subjects.
    subject: "secure link",
    needsBody: true,
    matches: (a) => a.toLowerCase().endsWith("@mail.anthropic.com"),
  },
  blancvpn: {
    from: "support@blancvpn.com",
    subject: "is your BlancVPN login code",
    needsBody: false,
    matches: (a) => a.toLowerCase() === "support@blancvpn.com",
  },
  news: {
    from: "blancvpn.org",
    needsBody: false,
    matches: (a) => a.toLowerCase().endsWith("blancvpn.org"),
  },
};

function newClient(): ImapFlow {
  const cfg = getImapConfig();
  if (!cfg) throw new ImapConfigError();
  return new ImapFlow({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 993,
    auth: { user: cfg.user, pass: cfg.pass },
    logger: false,
    socketTimeout: 20_000,
  });
}

export async function fetchMessages(
  category: Category,
  limit = 20,
): Promise<MailMessage[]> {
  const cfg = getImapConfig();
  if (!cfg) throw new ImapConfigError();
  const def = SEARCH[category];

  const client = newClient();
  await client.connect();
  const lock = await client.getMailboxLock(cfg.mailbox);
  try {
    const criteria: SearchObject = { from: def.from };
    if (def.subject) criteria.subject = def.subject;
    if (cfg.lookbackDays > 0) {
      criteria.since = new Date(Date.now() - cfg.lookbackDays * 86_400_000);
    }

    const uids = (await client.search(criteria, { uid: true })) || [];
    if (uids.length === 0) return [];

    const latest = uids.slice(-limit);
    const messages: MailMessage[] = [];
    for await (const msg of client.fetch(
      latest,
      { uid: true, envelope: true, source: def.needsBody },
      { uid: true },
    )) {
      messages.push(await toListMessage(category, def, msg));
    }

    messages.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    return messages;
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }
}

export async function fetchMessageBody(
  category: Category,
  uid: number,
): Promise<FullMail | null> {
  const cfg = getImapConfig();
  if (!cfg) throw new ImapConfigError();
  const def = SEARCH[category];

  const client = newClient();
  await client.connect();
  const lock = await client.getMailboxLock(cfg.mailbox);
  try {
    const msg = await client.fetchOne(
      String(uid),
      { uid: true, envelope: true, source: true },
      { uid: true },
    );
    if (!msg || !msg.source) return null;

    const fromAddress = msg.envelope?.from?.[0]?.address ?? "";
    if (!def.matches(fromAddress)) return null;

    const parsed = await simpleParser(msg.source);
    return {
      uid,
      category,
      fromAddress,
      fromName: msg.envelope?.from?.[0]?.name || fromAddress,
      subject: msg.envelope?.subject ?? parsed.subject ?? "",
      date: (msg.envelope?.date ?? parsed.date ?? new Date()).toISOString(),
      html: typeof parsed.html === "string" ? parsed.html : null,
      text: parsed.text ?? "",
    };
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }
}

async function toListMessage(
  category: Category,
  def: SearchDef,
  msg: FetchMessageObject,
): Promise<MailMessage> {
  const env = msg.envelope;
  const fromAddress = env?.from?.[0]?.address ?? "";
  const fromName = env?.from?.[0]?.name || fromAddress;
  const subject = env?.subject ?? "";
  const date = (env?.date ?? new Date()).toISOString();

  let html = "";
  let text = "";
  if (def.needsBody && msg.source) {
    const parsed = await simpleParser(msg.source);
    html = typeof parsed.html === "string" ? parsed.html : "";
    text = parsed.text ?? "";
  }

  const base = { uid: msg.uid, category, fromAddress, fromName, subject, date };

  if (category === "blancvpn") {
    return { ...base, code: extractLoginCode(subject, text), preview: subject };
  }
  if (category === "claude") {
    const loginUrl = extractClaudeLoginUrl(html, text);
    return {
      ...base,
      loginUrl,
      loginClient: extractLoginClient(loginUrl),
      preview: snippet(text) || subject,
    };
  }
  return { ...base, preview: subject };
}
