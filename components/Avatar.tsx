"use client";

import { useState } from "react";

/** Telegram photo of the key's owner, or initials on the key's color. */
export function Avatar({
  name,
  telegram,
  color,
  size = 32,
}: {
  name: string;
  telegram?: string;
  color?: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const initials = (name.match(/[\p{L}\p{N}]+/gu) ?? ["?"])
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        ...(color ? { background: color, color: "#fff", boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${color}` } : {}),
      }}
    >
      {telegram && !failed ? (
        <img src={`/api/avatar/${telegram}`} alt="" onError={() => setFailed(true)} />
      ) : (
        initials
      )}
    </span>
  );
}
