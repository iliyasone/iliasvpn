import { CopyButton } from "./CopyButton";

/** Shows the login email with a one-tap copy button. */
export function EmailChip({ email }: { email: string }) {
  if (!email) {
    return (
      <span className="email-chip email-chip-empty">
        адрес не задан (переменная EMAIL)
      </span>
    );
  }
  return (
    <span className="email-chip">
      <code>{email}</code>
      <CopyButton value={email} label="Копировать" className="email-chip-copy" />
    </span>
  );
}
