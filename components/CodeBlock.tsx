import { CopyButton } from "./CopyButton";
import { withSecret } from "./Secret";

/** Code with a copy button; `secret` is blurred on screen but copied as is. */
export function CodeBlock({ value, label = "Копировать", secret }: { value: string; label?: string; secret?: string }) {
  return (
    <div className="codeblock">
      <pre>
        <code>{withSecret(value, secret)}</code>
      </pre>
      <div className="codeblock-bar">
        <CopyButton value={value} label={label} />
      </div>
    </div>
  );
}
