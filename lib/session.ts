import "server-only";
import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  ADMIN_COOKIE,
  canUse,
  isAdminCookie,
  resolveToken,
  type AccessEntry,
  type Service,
} from "./access";

export const ADMIN_TELEGRAM = "iliyasone";

/** Who is looking at the page: the admin (any service) or an invited person. */
export type Viewer =
  | { kind: "admin"; name: string; telegram: string }
  | { kind: "invite"; name: string; telegram?: string; invite: AccessEntry & { token: string } };

export async function currentViewer(): Promise<Viewer | null> {
  if (await isAdmin()) return { kind: "admin", name: "Ильяс", telegram: ADMIN_TELEGRAM };
  const invite = await currentInvite();
  if (!invite) return null;
  return { kind: "invite", name: invite.name, telegram: invite.telegram, invite };
}

export function viewerCan(viewer: Viewer | null, service: Service): boolean {
  if (!viewer) return false;
  return viewer.kind === "admin" || canUse(viewer.invite, service);
}

export async function currentInvite() {
  const jar = await cookies();
  return resolveToken(jar.get(ACCESS_COOKIE)?.value);
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return isAdminCookie(jar.get(ADMIN_COOKIE)?.value);
}
