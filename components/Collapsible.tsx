"use client";

import { useState, type ReactNode } from "react";

export function Collapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="collapsible">
      <button
        type="button"
        className="collapsible-head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        <span className={`chevron ${open ? "chevron-open" : ""}`} aria-hidden>
          ⌄
        </span>
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  );
}
