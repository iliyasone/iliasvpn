export function extractLoginCode(
  subject: string,
  text: string,
): string | undefined {
  const fromSubject = subject.match(/\b(\d{4,8})\b/);
  if (fromSubject) return fromSubject[1];
  const fromText = text.match(/\b(\d{4,8})\b/);
  return fromText?.[1];
}
