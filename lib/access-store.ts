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

function apiUrl(path: string, teamId?: string): URL {
  const url = new URL(`https://api.vercel.com${path}`);
  if (teamId) url.searchParams.set("teamId", teamId);
  return url;
}

/**
 * Strongly consistent read through the REST API. The edge replica used by
 * `readTokens()` lags writes by a few seconds, which is fine for access
 * checks but would make read-modify-write in the admin clobber itself.
 * Falls back to the edge read when the API token is missing.
 */
export async function readTokensFresh(): Promise<AccessTokens> {
  const apiToken = process.env.VERCEL_API_TOKEN?.trim();
  const id = process.env.EDGE_CONFIG_ID?.trim();
  if (!apiToken || !id) return readTokens();
  const res = await fetch(apiUrl(`/v1/edge-config/${id}/item/tokens`, process.env.VERCEL_TEAM_ID?.trim()), {
    headers: { Authorization: `Bearer ${apiToken}` },
    cache: "no-store",
  });
  if (res.status === 404) return {};
  if (!res.ok) {
    throw new AccessStoreError(`Edge Config read failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const body = (await res.json()) as { value?: AccessTokens };
  return body.value && typeof body.value === "object" ? body.value : {};
}

async function writeTokens(tokens: AccessTokens): Promise<void> {
  const { apiToken, id, teamId } = writeConfig();
  const res = await fetch(apiUrl(`/v1/edge-config/${id}/items`, teamId), {
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
  const tokens = await readTokensFresh();
  const token = generateToken();
  const entry: AccessEntry = { name, createdAt: new Date().toISOString() };
  await writeTokens({ ...tokens, [token]: entry });
  return { token, entry };
}

export async function revokeInvite(token: string): Promise<boolean> {
  const tokens = await readTokensFresh();
  const entry = tokens[token];
  if (!entry) return false;
  await writeTokens({
    ...tokens,
    [token]: { ...entry, revokedAt: entry.revokedAt ?? new Date().toISOString() },
  });
  return true;
}

export async function restoreInvite(token: string): Promise<boolean> {
  const tokens = await readTokensFresh();
  const entry = tokens[token];
  if (!entry) return false;
  const { revokedAt: _drop, ...rest } = entry;
  await writeTokens({ ...tokens, [token]: rest });
  return true;
}

export async function deleteInvite(token: string): Promise<boolean> {
  const tokens = await readTokensFresh();
  if (!(token in tokens)) return false;
  const { [token]: _drop, ...rest } = tokens;
  await writeTokens(rest);
  return true;
}

/** Best-effort: records when/where a token was last used. Never throws. */
export async function touchInvite(token: string, from: string): Promise<AccessEntry | null> {
  try {
    const tokens = await readTokensFresh();
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
