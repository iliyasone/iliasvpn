"use client";

import { useState } from "react";

export function Avatar({ name, telegram, size = 32 }: { name: string; telegram?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = (name.match(/[\p{L}\p{N}]+/gu) ?? ["?"])
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {telegram && !failed ? (
        <img src={`/api/avatar/${telegram}`} alt="" onError={() => setFailed(true)} />
      ) : (
        initials
      )}
    </span>
  );
}
