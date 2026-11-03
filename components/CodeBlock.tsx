import { CopyButton } from "./CopyButton";

export function CodeBlock({ value, label = "Копировать" }: { value: string; label?: string }) {
  return (
    <div className="codeblock">
      <pre>
        <code>{value}</code>
      </pre>
      <div className="codeblock-bar">
        <CopyButton value={value} label={label} />
      </div>
    </div>
  );
}
