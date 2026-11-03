import { randomBytes } from "node:crypto";

/** A secret on screen: random text of the same length, blurred, so the real value never shows (copy buttons still copy it). */
export function Secret({ value }: { value: string }) {
  const prefix = value.match(/^sk-hub-/)?.[0] ?? "";
  const fake = randomBytes(value.length).toString("hex").slice(0, value.length - prefix.length);
  return (
    <span className="secret" aria-label="скрыто">
      {prefix}
      <span className="secret-blur">{fake}</span>
    </span>
  );
}

/** Text with every occurrence of `secret` replaced by <Secret>. */
export function withSecret(text: string, secret?: string) {
  if (!secret) return text;
  return text.split(secret).flatMap((part, i) => (i === 0 ? [part] : [<Secret key={i} value={secret} />, part]));
}
