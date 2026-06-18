"use client";

import type { FetchStatus } from "./useMessages";
import { RelativeTime } from "./RelativeTime";

export function LiveStatus({
  status,
  lastUpdated,
}: {
  status: FetchStatus;
  lastUpdated: string | null;
}) {
  return (
    <div className="live-status">
      <span className={`live-dot ${status === "ok" ? "live-dot-on" : ""}`} />
      {status === "ok" && lastUpdated ? (
        <span>
          обновлено <RelativeTime iso={lastUpdated} /> · автообновление
        </span>
      ) : status === "loading" ? (
        <span>подключение к почте…</span>
      ) : (
        <span>нет связи с почтой</span>
      )}
    </div>
  );
}
