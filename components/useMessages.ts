"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category, MailMessage, MessagesResponse } from "@/lib/types";

export type FetchStatus = "loading" | "ok" | "error" | "not-configured";

export interface UseMessages {
  messages: MailMessage[];
  status: FetchStatus;
  lastUpdated: string | null;
}

export function useMessages(
  category: Category | null,
  intervalMs = 6_000,
): UseMessages {
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [status, setStatus] = useState<FetchStatus>(
    category ? "loading" : "ok",
  );
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!category) return;
    try {
      const res = await fetch(`/api/messages?category=${category}`, {
        cache: "no-store",
      });
      if (res.status === 503) {
        setStatus("not-configured");
        return;
      }
      if (!res.ok) {
        setStatus((s) => (s === "loading" ? "error" : s));
        return;
      }
      const data: MessagesResponse = await res.json();
      setMessages(data.messages);
      setLastUpdated(data.fetchedAt);
      setStatus("ok");
    } catch {
      setStatus((s) => (s === "loading" ? "error" : s));
    }
  }, [category]);

  useEffect(() => {
    if (!category) return;
    load();
    const id = window.setInterval(load, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [category, load, intervalMs]);

  return { messages, status, lastUpdated };
}
