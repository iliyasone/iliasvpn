"use client";

import { useEffect, useState } from "react";
import type { Category, FullMail } from "@/lib/types";

export function EmailViewer({
  category,
  uid,
}: {
  category: Category;
  uid: number;
}) {
  const [mail, setMail] = useState<FullMail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setMail(null);
    setError(null);
    fetch(`/api/message?category=${category}&uid=${uid}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "Ошибка");
        return res.json() as Promise<FullMail>;
      })
      .then((data) => active && setMail(data))
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [category, uid]);

  if (error) return <p className="viewer-msg">Не удалось загрузить письмо</p>;
  if (!mail) return <p className="viewer-msg">Загрузка…</p>;

  if (mail.html) {
    return (
      <iframe
        title={mail.subject}
        className="email-frame"
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        srcDoc={wrap(mail.html)}
      />
    );
  }

  return <pre className="email-text">{mail.text || "(пустое письмо)"}</pre>;
}

function wrap(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>html,body{margin:0;padding:14px;background:#fff;color:#111;font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif;font-size:14px}img{max-width:100%;height:auto}a{color:#2563eb}</style></head><body>${html}</body></html>`;
}
