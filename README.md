# iliasvpn

A small, self-hosted web service that surfaces **login codes and login links**
from a Gmail inbox the instant they arrive — so you never have to dig through
your mail app to copy a one-time code again.

It watches BlancVPN email and presents each as its own guided flow:

| Flow | What it shows | Source email |
| --- | --- | --- |
| **BlancVPN** | The 6-digit login **code** (plus install + login instructions and a "Новости" feed) | `support@blancvpn.com`, subject `… is your BlancVPN login code` |
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

- **`/api/messages?category=blancvpn|news`** — searches the mailbox,
  extracts the BlancVPN code and returns a lightweight
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
| `HUB_URL` | ✅ | Claude Code hub address; keys, sign-in and `/claude` live there. |
| `HUB_ADMIN_KEY` | ✅ | Admin key of the Claude Code hub (server only). |
| `TELEGRAM_BOT_TOKEN` | – | Bot token from [@BotFather](https://t.me/BotFather) for visitor notifications. |
| `TELEGRAM_CHAT_ID` | – | Your Telegram chat id (ask [@userinfobot](https://t.me/userinfobot)). |

### Access: one key per person or agent

Everyone signs in with a personal link `https://<host>/<page>?key=<key>`. Keys
live in the Claude Code hub (claude-hub): name, Telegram username (avatar),
color, and what the key opens — **Claude** (Claude Code through the hub plus
the `/claude` page), **Gemini** (dictation in Ciao through the shared Google key
plus the `/gemini` page), **BlancVPN**, and admin. Opening a link stores the key in
an httpOnly cookie for a year; the page also renders from the URL on the first
request, so an agent can read it without a cookie jar. Old `/code?key=…` links
redirect to `/claude?key=…`.

- `/claude` — the account's weekly limit (this key's part in its color, the
  rest in gray, what is left), this key's spend, the endpoint and key (blurred
  on screen, copy buttons copy it), and how to connect T3 Code and Claude Code.
- `/gemini` — this key's Gemini spend (today, 7 and 30 days), Ciao downloads
  from its latest release, and the one link to paste into Ciao:
  `https://gemini.sheetlife.app/?key=<key>` (the Gemini proxy in claude-hub).
- `/blancvpn` — install, login by code, BlancVPN emails.
- `/admin` (admin keys only) — spend today, over 7 days and all time (Claude and
  Gemini), the weekly limit split by person, spend per day by person (pick a day to
  see who spent what), and the list of people sorted by spend. A person can own
  several keys (their machines and agents) whose spend adds up. Per key: name and
  Telegram edited in place, whose key it is, color, access, links, revoke, delete.

The site follows the device's light or dark setting; the button in the header
switches it and remembers the choice in a cookie.

### Visitor notifications

When both `TELEGRAM_*` vars are set, the bot messages you whenever someone
opens `/blancvpn` — name from the key, IP and city from
Vercel headers — at most once per 10 minutes per page per browser (throttled by
an httpOnly cookie set on the server).

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
  claude/page.tsx       Limits, spend and connection for the signed-in key
  admin/page.tsx        Keys and the weekly limit by key (admin keys)
  api/messages/route.ts List endpoint (per category) + visit notification
  api/message/route.ts  Single full-email endpoint
  api/hub/admin/*       Admin pass-through to the hub
middleware.ts           Personal link → key cookie
lib/
  hub.ts / session.ts   The key of this browser and its usage, from the hub
  visit.ts              Telegram visit notifications
  imap.ts               IMAP connect / search / parse (server-only)
  extract.ts            Pull the code out of an email
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

- Built for **one mailbox** (a personal helper). Anyone holding a key with BlancVPN access
  sees the codes, so treat links as secrets and revoke leaked ones in
  `/admin`.
- Codes/links are matched by sender + subject; if those email templates change,
  update the rules in `lib/imap.ts` / `lib/extract.ts`.
- Only `INBOX` is searched by default (archived mail is skipped).
