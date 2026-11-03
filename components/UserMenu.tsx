"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";

export function UserMenu({ name, telegram, admin }: { name: string; telegram?: string; admin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="user" ref={ref}>
      {admin && (
        <Link href="/admin" className="user-admin">
          Админка
        </Link>
      )}
      <button type="button" className="user-button" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <Avatar name={name} telegram={telegram} />
      </button>
      {open && (
        <div className="user-menu">
          <p className="user-name">{name}</p>
          {telegram && <p className="admin-meta">@{telegram}</p>}
          <form method="post" action="/api/logout">
            <button type="submit" className="linkbtn">
              Выйти
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
