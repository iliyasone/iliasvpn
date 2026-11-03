import "server-only";
import { cache } from "react";
import { currentHubKey, type HubMe } from "./hub";

export type Service = "claude" | "blancvpn";

/** Who is looking at the page: the holder of a key (person or agent), with its usage. */
export interface Viewer {
  name: string;
  telegram?: string;
  color: string;
  admin: boolean;
  access: Record<Service, boolean>;
  me: HubMe;
}

export const currentViewer = cache(async (): Promise<Viewer | null> => {
  const me = await currentHubKey();
  if (!me) return null;
  const { key } = me;
  return {
    name: key.name,
    telegram: key.telegram ?? undefined,
    color: key.color,
    admin: key.admin,
    access: { claude: key.claude, blancvpn: key.blancvpn },
    me,
  };
});

export function viewerCan(viewer: Viewer | null, service: Service): boolean {
  return Boolean(viewer && (viewer.admin || viewer.access[service]));
}

export async function isAdmin(): Promise<boolean> {
  return Boolean((await currentViewer())?.admin);
}
