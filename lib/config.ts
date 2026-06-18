/**
 * Reads IMAP / mailbox configuration from environment variables.
 *
 * The variable names intentionally match the existing project `.env`:
 *   EMAIL          - the Gmail address (also used as the IMAP login)
 *   EMAIL_PASSWORD - a Gmail *app password* (not the account password)
 *   IMAP           - the IMAP host, e.g. imap.gmail.com
 *
 * Optional overrides:
 *   IMAP_PORT          - defaults to 993 (implicit TLS)
 *   IMAP_MAILBOX       - defaults to "INBOX"
 *   MAIL_LOOKBACK_DAYS - how far back to search, defaults to 30
 *   LOGIN_EMAIL        - the address shown to the user in the instructions,
 *                        defaults to EMAIL (they are normally the same)
 */

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

/** The login email shown in the on-screen instructions. */
export function getLoginEmail(): string {
  return (process.env.LOGIN_EMAIL || process.env.EMAIL || "").trim();
}

/** Whether the server has enough configuration to talk to IMAP. */
export function isImapConfigured(): boolean {
  return getImapConfig() !== null;
}
