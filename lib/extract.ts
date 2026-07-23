export function extractLoginCode(
  subject: string,
  text: string,
): string | undefined {
  const fromSubject = subject.match(/\b(\d{4,8})\b/);
  if (fromSubject) return fromSubject[1];
  const fromText = text.match(/\b(\d{4,8})\b/);
  return fromText?.[1];
}

export function extractClaudeLoginUrl(
  html: string,
  text: string,
): string | undefined {
  const candidates: string[] = [];

  const hrefRe = /href\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = hrefRe.exec(html))) candidates.push(decodeEntities(m[1]));

  const textRe = /https?:\/\/[^\s<>"'\])]+/gi;
  while ((m = textRe.exec(text))) candidates.push(m[0]);

  const cleaned = candidates
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\//i.test(u))
    .filter((u) => !/\.(png|jpe?g|gif|svg|webp|css|woff2?)(\?|#|$)/i.test(u))
    .filter(
      (u) => !/(unsubscribe|privacy|terms|\/legal|cookie|mailto:)/i.test(u),
    );

  const preferred = cleaned.find((u) =>
    /(magic|login|verify|sign[-_]?in|confirm|claude\.ai)/i.test(u),
  );
  return preferred ?? cleaned[0];
}

// The magic link carries the requesting client as a query param, e.g.
// https://claude.ai/magic-link?client=desktop_app#... — absent for web logins.
export function extractLoginClient(loginUrl: string | undefined): string | undefined {
  if (!loginUrl) return undefined;
  try {
    return new URL(loginUrl).searchParams.get("client") ?? undefined;
  } catch {
    return undefined;
  }
}

const CLIENT_LABELS: Record<string, string> = {
  desktop_app: "Claude Code",
};

export function loginClientLabel(client: string): string {
  return CLIENT_LABELS[client] ?? client.replace(/_/g, " ");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#0?43;/g, "+")
    .replace(/&#0?61;/g, "=")
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, "/");
}

export function snippet(text: string, max = 160): string {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}
