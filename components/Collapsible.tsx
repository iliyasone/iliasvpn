"use client";

import { useState, type ReactNode } from "react";

export function Collapsible({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="collapsible">
      <button
        type="button"
        className="collapsible-head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="chev">⌄</span>
        <span>{title}</span>
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  );
}
