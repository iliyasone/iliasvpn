// Client-safe: no server or Edge Config imports.

export type Service = "blancvpn" | "claude";
export const SERVICES: Service[] = ["blancvpn", "claude"];

export function canUse(entry: { access?: Partial<Record<Service, boolean>> }, service: Service): boolean {
  return entry.access?.[service] !== false;
}

