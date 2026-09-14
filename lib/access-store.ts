import "server-only";
import { randomBytes } from "node:crypto";
import { readTokens, type AccessEntry, type AccessTokens } from "./access";

/**
 * Writes go through the Vercel REST API — Edge Config itself is read-only from
 * the app. Needs VERCEL_API_TOKEN (account token) and EDGE_CONFIG_ID.
 */
export class AccessStoreError extends Error {}

function writeConfig() {
  const apiToken = process.env.VERCEL_API_TOKEN?.trim();
  const id = process.env.EDGE_CONFIG_ID?.trim();
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  if (!apiToken || !id) {
    throw new AccessStoreError(
      "VERCEL_API_TOKEN / EDGE_CONFIG_ID не заданы — запись в Edge Config невозможна.",
    );
  }
  return { apiToken, id, teamId };
}

async function writeTokens(tokens: AccessTokens): Promise<void> {
  const { apiToken, id, teamId } = writeConfig();
  const url = new URL(`https://api.vercel.com/v1/edge-config/${id}/items`);
  if (teamId) url.searchParams.set("teamId", teamId);
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ operation: "upsert", key: "tokens", value: tokens }],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AccessStoreError(`Edge Config write failed: ${res.status} ${text}`);
  }
}

export function generateToken(): string {
  return randomBytes(12).toString("base64url");
}

export async function createInvite(name: string): Promise<{ token: string; entry: AccessEntry }> {
  const tokens = await readTokens();
  const token = generateToken();
  const entry: AccessEntry = { name, createdAt: new Date().toISOString() };
  await writeTokens({ ...tokens, [token]: entry });
  return { token, entry };
}

export async function revokeInvite(token: string): Promise<boolean> {
  const tokens = await readTokens();
  const entry = tokens[token];
  if (!entry) return false;
  await writeTokens({
    ...tokens,
    [token]: { ...entry, revokedAt: entry.revokedAt ?? new Date().toISOString() },
  });
  return true;
}

export async function restoreInvite(token: string): Promise<boolean> {
  const tokens = await readTokens();
  const entry = tokens[token];
  if (!entry) return false;
  const { revokedAt: _drop, ...rest } = entry;
  await writeTokens({ ...tokens, [token]: rest });
  return true;
}

export async function deleteInvite(token: string): Promise<boolean> {
  const tokens = await readTokens();
  if (!(token in tokens)) return false;
  const { [token]: _drop, ...rest } = tokens;
  await writeTokens(rest);
  return true;
}

/** Best-effort: records when/where a token was last used. Never throws. */
export async function touchInvite(token: string, from: string): Promise<AccessEntry | null> {
  try {
    const tokens = await readTokens();
    const entry = tokens[token];
    if (!entry) return null;
    const now = new Date().toISOString();
    const next: AccessEntry = {
      ...entry,
      firstSeenAt: entry.firstSeenAt ?? now,
      lastSeenAt: now,
      lastSeenFrom: from,
    };
    await writeTokens({ ...tokens, [token]: next });
    return entry;
  } catch (err) {
    console.error("[access] touch failed", err);
    return null;
  }
}
