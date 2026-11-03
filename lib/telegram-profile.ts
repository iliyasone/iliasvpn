import "server-only";

export interface TelegramProfile {
  name: string | null;
  /** Public avatar URL, or null when the profile hides it. */
  photo: string | null;
}

function meta(html: string, property: string): string | null {
  const m = html.match(new RegExp(`<meta property="og:${property}" content="([^"]*)"`));
  if (!m) return null;
  return m[1]
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Reads the public t.me page of a username: display name and avatar, when visible. */
export async function telegramProfile(username: string): Promise<TelegramProfile> {
  const res = await fetch(`https://t.me/${username}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 6 * 3600 },
  }).catch(() => null);
  if (!res?.ok) return { name: null, photo: null };
  const html = await res.text();
  const title = meta(html, "title");
  const image = meta(html, "image");
  return {
    name: title && !title.startsWith("Telegram: Contact") ? title : null,
    photo: image && !image.includes("telegram.org/img/") ? image : null,
  };
}
