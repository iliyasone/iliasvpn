export interface ImapConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  mailbox: string;
  lookbackDays: number;
}

export function getImapConfig(): ImapConfig | null {
  const host = process.env.IMAP?.trim();
  const user = process.env.EMAIL?.trim();
  const pass = process.env.EMAIL_PASSWORD;

  if (!host || !user || !pass) return null;

  return {
    host,
    port: Number(process.env.IMAP_PORT ?? 993),
    user,
    pass,
    mailbox: process.env.IMAP_MAILBOX?.trim() || "INBOX",
    lookbackDays: Number(process.env.MAIL_LOOKBACK_DAYS ?? 30),
  };
}

export function getLoginEmail(): string {
  return (process.env.LOGIN_EMAIL || process.env.EMAIL || "").trim();
}
