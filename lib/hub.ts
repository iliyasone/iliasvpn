import "server-only";
import { cookies } from "next/headers";

/** Public address of the Claude Code hub (CLIProxyAPI with a key/usage service in front). */
export const HUB_URL = (process.env.HUB_URL || "").replace(/\/$/, "");
export const HUB_KEY_COOKIE = "hubkey";

export interface HubTotals {
  cost: number;
  requests: number;
  tokens: number;
  last_used_at: number | null;
}

export interface HubKey {
  id: number;
  name: string;
  key: string;
  key_hint: string;
  created_at: number;
  revoked_at: number | null;
  today: HubTotals;
  week: HubTotals;
  total: HubTotals;
  daily: { date: string; cost: number }[];
  models: { model: string; cost: number; requests: number }[];
}

export interface HubLimit {
  window: string;
  utilization: number;
  reset: number | null;
  status: string | null;
  updated_at: number;
}

export interface HubMe {
  key: HubKey;
  limits: HubLimit[];
  week_start: number;
}

export interface HubOverview {
  keys: HubKey[];
  limits: HubLimit[];
  week_start: number;
  week: HubTotals;
  today: HubTotals;
  daily: { date: string; cost: number }[];
}

export function hubFetch(path: string, bearer: string, init: RequestInit = {}) {
  return fetch(HUB_URL + path, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${bearer}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export function hubAdminKey(): string | null {
  return process.env.HUB_ADMIN_KEY?.trim() || null;
}

/** The hub key saved in this browser, with its usage; null if missing or revoked. */
export async function currentHubKey(): Promise<HubMe | null> {
  const key = (await cookies()).get(HUB_KEY_COOKIE)?.value;
  if (!key || !HUB_URL) return null;
  const res = await hubFetch("/hub/me", key).catch(() => null);
  if (!res?.ok) return null;
  return (await res.json()) as HubMe;
}
