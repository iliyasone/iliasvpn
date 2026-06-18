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

  if (error) return <p className="email-viewer-msg">Не удалось загрузить письмо: {error}</p>;
  if (!mail) return <p className="email-viewer-msg">Загрузка письма…</p>;

  if (mail.html) {
    return (
      // Sandboxed: the email's own HTML/CSS renders but cannot run scripts,
      // submit forms, or touch this page. allow-popups lets links open.
      <iframe
        title={mail.subject}
        className="email-frame"
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        srcDoc={wrapHtml(mail.html)}
      />
    );
  }

  return <pre className="email-text">{mail.text || "(пустое письмо)"}</pre>;
}

function wrapHtml(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<base target="_blank">
<style>html,body{margin:0;padding:12px;background:#fff;color:#111;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}img{max-width:100%;height:auto}a{color:#2563eb}</style>
</head><body>${html}</body></html>`;
}
