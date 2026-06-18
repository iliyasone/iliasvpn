import { CopyButton } from "./CopyButton";

export function EmailChip({ email }: { email: string }) {
  if (!email) {
    return <span className="email-chip-empty">адрес не задан (EMAIL)</span>;
  }
  return (
    <span className="email-chip">
      <code>{email}</code>
      <CopyButton value={email} />
    </span>
  );
}
