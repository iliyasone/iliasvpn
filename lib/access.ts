import { get } from "@vercel/edge-config";

import type { Service } from "./services";
export { SERVICES, canUse, type Service } from "./services";

/** One invite: a personal token that maps to the person you gave it to. */
export interface AccessEntry {
  name: string;
  /** Telegram username without "@", used for the avatar. */
  telegram?: string;
  /** Per-service access; a missing key means allowed (invites made before this field). */
  access?: Partial<Record<Service, boolean>>;
  createdAt: string;
  revokedAt?: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
  lastSeenFrom?: string;
}

export type AccessTokens = Record<string, AccessEntry>;

export const ACCESS_COOKIE = "access";
export const ADMIN_COOKIE = "admin";
export const ACCESS_QUERY = "k";
export const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const TOKEN_RE = /^[A-Za-z0-9_-]{8,64}$/;

export function isTokenShaped(value: unknown): value is string {
  return typeof value === "string" && TOKEN_RE.test(value);
}

export async function readTokens(): Promise<AccessTokens> {
  if (!process.env.EDGE_CONFIG) return {};
  try {
    const tokens = await get<AccessTokens>("tokens");
    return tokens && typeof tokens === "object" ? tokens : {};
  } catch (err) {
    console.error("[access] edge config read failed", err);
    return {};
  }
}

/** Returns the invite behind a token if it exists and has not been revoked. */
export async function resolveToken(
  token: string | undefined | null,
): Promise<(AccessEntry & { token: string }) | null> {
  if (!isTokenShaped(token)) return null;
  const entry = (await readTokens())[token];
  if (!entry || entry.revokedAt) return null;
  return { ...entry, token };
}

/** Which service a mail category belongs to. */
export function serviceOf(category: string): Service {
  return category === "claude" ? "claude" : "blancvpn";
}

export const TELEGRAM_RE = /^[A-Za-z0-9_]{4,32}$/;

export function isAdminCookie(value: string | undefined): boolean {
  const expected = process.env.ADMIN_TOKEN?.trim();
  return Boolean(expected) && value === expected;
}
