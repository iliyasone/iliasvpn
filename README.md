# iliasvpn

A small, self-hosted web service that surfaces **login codes and login links**
from a Gmail inbox the instant they arrive — so you never have to dig through
your mail app to copy a one-time code again.

It watches two specific kinds of email and presents each as its own guided flow:

| Flow | What it shows | Source email |
| --- | --- | --- |
| **BlancVPN** | The 6-digit login **code** (plus install + login instructions and a "Новости" feed) | `support@blancvpn.com`, subject `… is your BlancVPN login code` |
| **Claude.ai** | The **secure login link** | `no-reply-*@mail.anthropic.com`, subject `Secure link to log in to Claude.ai` |
| **Новости** (News) | BlancVPN announcements | any sender at `blancvpn.org` |

All mail is read **server-side over IMAP** — credentials never reach the
browser. The frontend only ever talks to this app's own API routes.

> Naming: the repo is `ilias-vpn`; the running service is **iliasvpn**.

---

## How it works

```
Browser ──fetch──▶ /api/messages?category=…  ─┐
                   /api/message?category=&uid= │  (Next.js Node runtime)
                                               ▼
                                       lib/imap.ts  ──IMAP/TLS──▶  Gmail
```

- **`/api/messages?category=claude|blancvpn|news`** — searches the mailbox,
  extracts the code (BlancVPN) or login URL (Claude), and returns a lightweight
  JSON list (no raw HTML).
- **`/api/message?category=…&uid=…`** — returns the full body of one message on
  demand. The viewer renders it inside a **sandboxed iframe** (no scripts), and
  the endpoint refuses any UID whose sender doesn't match the category, so it
  can't be used to read unrelated inbox mail.
- The pages **poll** every few seconds. A code/link that arrived in the last
  ten minutes is shown prominently at the top; otherwise nothing is highlighted
  and you just see the list of related emails. So a code you just requested
  shows up on its own, without leaving stale ones lying around.

The login email shown in the instructions comes from the `EMAIL` (or
`LOGIN_EMAIL`) environment variable and is read on the server.

---

## Configuration

Copy `.env.example` to `.env` (or `.env.local`) and fill it in:

```bash
cp .env.example .env
```

| Variable | Required | Description |
| --- | --- | --- |
| `EMAIL` | ✅ | Gmail address to read; also shown in the login instructions. |
| `EMAIL_PASSWORD` | ✅ | Gmail **App Password** (not the account password). |
| `IMAP` | ✅ | IMAP host, e.g. `imap.gmail.com`. |
| `IMAP_PORT` | – | Defaults to `993` (implicit TLS). |
| `IMAP_MAILBOX` | – | Defaults to `INBOX`. |
| `MAIL_LOOKBACK_DAYS` | – | How far back to search. Defaults to `30`. |
| `LOGIN_EMAIL` | – | Address shown in instructions. Defaults to `EMAIL`. |
| `EDGE_CONFIG` | ✅ | Read connection string of the Edge Config holding invites. Without it everything is locked. |
| `EDGE_CONFIG_ID` | – | Edge Config id; needed together with `VERCEL_API_TOKEN` to create/revoke invites from `/admin`. |
| `VERCEL_API_TOKEN` | – | Vercel account token used to write to the Edge Config. |
| `VERCEL_TEAM_ID` | – | Team id, if the Edge Config belongs to a team. |
| `ADMIN_TOKEN` | ✅ | Password for `/admin`. |
| `TELEGRAM_BOT_TOKEN` | – | Bot token from [@BotFather](https://t.me/BotFather) for visitor notifications. |
| `TELEGRAM_CHAT_ID` | – | Your Telegram chat id (ask [@userinfobot](https://t.me/userinfobot)). |

### Access control

Access is by **personal invite link**: `https://<host>/?k=<token>`. Opening it
stores the token in an httpOnly cookie for a year and redirects to the page
without the token in the URL. `middleware.ts` checks the cookie on
`/api/messages` and `/api/message` (401 otherwise), and the `/claude` and
`/blancvpn` pages render a "write to Ilias in Telegram" screen instead of the
flow when the cookie is missing or the invite was revoked. The landing page
stays public.

Invites live in a Vercel **Edge Config** under the key `tokens`:

```json
{ "tokens": { "<token>": { "name": "Маша", "createdAt": "…", "lastSeenAt": "…" } } }
```

`/admin` (password = `ADMIN_TOKEN`) lists everyone, creates a link for a name,
and revokes / restores / deletes entries. Writes go through the Vercel REST API,
so `VERCEL_API_TOKEN` + `EDGE_CONFIG_ID` must be set; reads only need
`EDGE_CONFIG`.

### Visitor notifications

When both `TELEGRAM_*` vars are set, the bot messages you whenever an invited
person opens `/claude` or `/blancvpn` — name from the invite, IP and city from
Vercel headers — at most once per 10 minutes per page per browser (throttled by
an httpOnly cookie set on the server). The first use of an invite is marked 🆕.

### Getting a Gmail App Password

1. Enable 2-Step Verification on the Google account.
2. Go to <https://myaccount.google.com/apppasswords>.
3. Create a password (e.g. named "iliasvpn") and paste the 16-character value
   into `EMAIL_PASSWORD`.
4. Make sure IMAP is enabled in Gmail → Settings → *Forwarding and POP/IMAP*.

---

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

If the env vars are missing, the site still renders the instructions and shows a
"почта не настроена" notice in place of the live codes.

```bash
npm run build && npm start   # production build
```

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **New Project → Import** the repo (framework auto-detected as
   Next.js).
3. Add the environment variables from the table above in
   **Settings → Environment Variables**.
4. Deploy.

The API routes declare `runtime = "nodejs"` (imapflow needs real TCP/TLS
sockets, so the Edge runtime won't work) and `dynamic = "force-dynamic"` so mail
is never cached.

---

## Project layout

```
app/
  page.tsx              Landing — two logo cards
  blancvpn/page.tsx     BlancVPN: install + login by code + emails
  claude/page.tsx       Claude.ai: login by secure link + emails
  admin/page.tsx        Invite management (behind ADMIN_TOKEN)
  api/messages/route.ts List endpoint (per category) + visit notification
  api/message/route.ts  Single full-email endpoint
  api/admin/*           Admin login + invite CRUD
middleware.ts           Invite-link cookie + API access checks
lib/
  access.ts             Invite lookup (Edge Config, edge-safe)
  access-store.ts       Invite writes via Vercel API (server-only)
  visit.ts              Telegram visit notifications
  imap.ts               IMAP connect / search / parse (server-only)
  extract.ts            Pull code / login URL out of an email
  config.ts             Env-var reading
  install-links.ts      BlancVPN download links
components/
  Inbox.tsx             Recent code/link + merged email list
  EmailList.tsx         Inbox-style list of related emails
  EmailViewer.tsx       Renders an email in a sandboxed iframe
public/logos/           BlancVPN and Claude logos
```

---

## Notes & limitations

- Built for **one mailbox** (a personal helper). Anyone holding a valid invite
  link sees the codes, so treat links as secrets and revoke leaked ones in
  `/admin`.
- Codes/links are matched by sender + subject; if those email templates change,
  update the rules in `lib/imap.ts` / `lib/extract.ts`.
- Only `INBOX` is searched by default (archived mail is skipped).
