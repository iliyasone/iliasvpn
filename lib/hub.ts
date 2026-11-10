import "server-only";
import { cookies, headers } from "next/headers";

/** Public address of the Claude Code hub (CLIProxyAPI with a key/usage service in front). */
export const HUB_URL = (process.env.HUB_URL || "").replace(/\/$/, "");
/** Public address of the Gemini proxy (gemini.mjs in claude-hub): the Gemini API behind hub keys. */
export const GEMINI_URL = "https://gemini.sheetlife.app";
export const HUB_KEY_COOKIE = "hubkey";
/** Set by middleware when the key came in the URL, so the page renders on the first request (agents fetch without cookies). */
export const HUB_KEY_HEADER = "x-hub-key";

export interface HubTotals {
  cost: number;
  requests: number;
  tokens: number;
  last_used_at: number | null;
}

/** Gemini transcriptions through the proxy, priced per minute of audio. */
export interface GeminiTotals {
  cost: number;
  minutes: number;
  requests: number;
  last_used_at: number | null;
}

/** Today, the last 7 and 30 days, all time. */
export interface GeminiUsage {
  today: GeminiTotals;
  week: GeminiTotals;
  month: GeminiTotals;
  total: GeminiTotals;
}

export interface HubKey {
  id: number;
  name: string;
  /** Telegram username without "@", shown as the avatar. */
  telegram: string | null;
  /** Hex color of the key in charts and the avatar. */
  color: string;
  /** What the key opens: Claude (Claude Code through the hub and /claude), Gemini (the proxy and /gemini), BlancVPN page, admin. */
  claude: boolean;
  gemini: boolean;
  blancvpn: boolean;
  admin: boolean;
  key: string;
  key_hint: string;
  created_at: number;
  revoked_at: number | null;
  today: HubTotals;
  week: HubTotals;
  total: HubTotals;
  daily: { date: string; cost: number }[];
  models: { model: string; cost: number; requests: number }[];
  gemini_usage: GeminiUsage;
  /** Estimated part of the account weekly limit this key used this week (0..1). */
  week_limit: number;
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
  /** Part of the weekly limit Anthropic gave back mid-week (0..1) and when; null if none. */
  week_returned?: { share: number; at: number } | null;
}

export interface HubOverview {
  keys: HubKey[];
  limits: HubLimit[];
  week_start: number;
  week: HubTotals;
  today: HubTotals;
  daily: { date: string; cost: number }[];
  gemini: GeminiUsage;
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

/** The key of this browser (cookie, or the URL via middleware), with its usage; null if missing or revoked. */
export async function currentHubKey(): Promise<HubMe | null> {
  const key = (await headers()).get(HUB_KEY_HEADER) || (await cookies()).get(HUB_KEY_COOKIE)?.value;
  if (!key || !HUB_URL) return null;
  const res = await hubFetch("/hub/me", key).catch(() => null);
  if (!res?.ok) return null;
  return (await res.json()) as HubMe;
}

/** Whether a Telegram username belongs to one of the hub keys (for the avatar proxy). */
export async function isHubTelegram(username: string): Promise<boolean> {
  const admin = hubAdminKey();
  if (!admin || !HUB_URL) return false;
  const res = await hubFetch("/hub/admin/keys", admin).catch(() => null);
  if (!res?.ok) return false;
  const { keys } = (await res.json()) as { keys: { telegram: string | null }[] };
  return keys.some((k) => k.telegram === username);
}
