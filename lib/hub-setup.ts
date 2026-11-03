/** Shell command that points Claude Code on a machine at the hub (merges into ~/.claude/settings.json). */
export function setupCommand(hub: string, key: string): string {
  return `python3 - <<'EOF'
import json, pathlib
p = pathlib.Path.home() / ".claude" / "settings.json"
d = json.loads(p.read_text()) if p.exists() else {}
d.setdefault("env", {}).update({
    "ANTHROPIC_BASE_URL": "${hub}",
    "ANTHROPIC_AUTH_TOKEN": "${key}",
})
p.parent.mkdir(parents=True, exist_ok=True)
p.write_text(json.dumps(d, indent=2))
print("Claude Code -> ${hub}")
EOF`;
}

export function settingsSnippet(hub: string, key: string): string {
  return JSON.stringify(
    { env: { ANTHROPIC_BASE_URL: hub, ANTHROPIC_AUTH_TOKEN: key } },
    null,
    2,
  );
}

export function usageCommand(hub: string, key: string): string {
  return `curl -s ${hub}/hub/me.txt -H "Authorization: Bearer ${key}"`;
}

/** Personal link of a key: signs the browser in and opens /claude, else /gemini, else the home page. */
export function keyPageUrl(origin: string, key: string, access: { claude: boolean; gemini: boolean }): string {
  return `${origin}/${access.claude ? "claude" : access.gemini ? "gemini" : ""}?key=${key}`;
}
