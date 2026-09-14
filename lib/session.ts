import "server-only";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, ADMIN_COOKIE, isAdminCookie, resolveToken } from "./access";

export async function currentInvite() {
  const jar = await cookies();
  return resolveToken(jar.get(ACCESS_COOKIE)?.value);
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return isAdminCookie(jar.get(ADMIN_COOKIE)?.value);
}
