/**
 * Pulls the useful bit out of each kind of email:
 *  - BlancVPN: a numeric login code (lives in the subject line).
 *  - Claude.ai: the "secure link to log in" URL (lives in the HTML body).
 */

/**
 * BlancVPN subjects look like: "123456 is your BlancVPN login code".
 * We grab the code from the subject first, then fall back to the body.
 */
export function extractLoginCode(
  subject: string,
  text: string,
): string | undefined {
  const fromSubject = subject.match(/\b(\d{4,8})\b/);
  if (fromSubject) return fromSubject[1];
  const fromText = text.match(/\b(\d{4,8})\b/);
  return fromText?.[1];
}

/**
 * Claude.ai "Secure link to log in" emails carry the magic link inside a CTA
 * button. We collect every href, drop the boilerplate (images, unsubscribe,
 * legal pages), then prefer the link that looks like a login/magic link.
 */
export function extractClaudeLoginUrl(
  html: string,
  text: string,
): string | undefined {
  const candidates: string[] = [];

  const hrefRe = /href\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = hrefRe.exec(html))) candidates.push(decodeEntities(m[1]));

  const textRe = /https?:\/\/[^\s<>"')]+/gi;
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

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#0?43;/g, "+")
    .replace(/&#0?61;/g, "=")
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, "/");
}

/** A short, single-line plain-text preview for list rows. */
export function snippet(text: string, max = 160): string {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}
