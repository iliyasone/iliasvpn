"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Category, MailMessage, MessagesResponse } from "@/lib/types";

export type FetchStatus = "loading" | "ok" | "error" | "not-configured";

export interface UseMessages {
  messages: MailMessage[];
  status: FetchStatus;
  error: string | null;
  lastUpdated: string | null;
  newUids: Set<number>;
  refresh: () => void;
}

const HIGHLIGHT_MS = 30_000;

/**
 * Polls `/api/messages?category=…` on an interval and keeps the latest data.
 * Messages that appear *after* the first load are flagged as "new" for a
 * short while so the UI can highlight them the moment they arrive.
 */
export function useMessages(
  category: Category,
  intervalMs = 8_000,
): UseMessages {
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [status, setStatus] = useState<FetchStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [newUids, setNewUids] = useState<Set<number>>(new Set());

  const seen = useRef<Set<number>>(new Set());
  const hadFirstLoad = useRef(false);
  const timers = useRef<number[]>([]);

  const flagNew = useCallback((uid: number) => {
    setNewUids((prev) => new Set(prev).add(uid));
    const t = window.setTimeout(() => {
      setNewUids((prev) => {
        const next = new Set(prev);
        next.delete(uid);
        return next;
      });
    }, HIGHLIGHT_MS);
    timers.current.push(t);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?category=${category}`, {
        cache: "no-store",
      });

      if (res.status === 503) {
        const body = await res.json().catch(() => ({}));
        setStatus("not-configured");
        setError(body.error ?? "IMAP is not configured.");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (!hadFirstLoad.current) setStatus("error");
        setError(body.error ?? "Не удалось получить письма.");
        return;
      }

      const data: MessagesResponse = await res.json();

      if (hadFirstLoad.current) {
        for (const m of data.messages) {
          if (!seen.current.has(m.uid)) flagNew(m.uid);
        }
      }
      for (const m of data.messages) seen.current.add(m.uid);
      hadFirstLoad.current = true;

      setMessages(data.messages);
      setLastUpdated(data.fetchedAt);
      setStatus("ok");
      setError(null);
    } catch {
      // Transient network blip — keep the last good data on screen.
      if (!hadFirstLoad.current) setStatus("error");
      setError("Не удалось получить письма.");
    }
  }, [category, flagNew]);

  useEffect(() => {
    load();
    const id = window.setInterval(load, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    const snapshot = timers;
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      snapshot.current.forEach((t) => window.clearTimeout(t));
    };
  }, [load, intervalMs]);

  return { messages, status, error, lastUpdated, newUids, refresh: load };
}
