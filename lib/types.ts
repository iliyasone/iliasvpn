/** Shared types & helpers usable from both server and client components. */

export type Category = "claude" | "blancvpn" | "news";

export const CATEGORIES: Category[] = ["claude", "blancvpn", "news"];

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && CATEGORIES.includes(value as Category);
}

export interface MailMessage {
  uid: number;
  category: Category;
  fromAddress: string;
  fromName: string;
  subject: string;
  date: string; // ISO-8601
  preview: string;
  /** BlancVPN only. */
  code?: string;
  /** Claude only. */
  loginUrl?: string;
}

export interface FullMail {
  uid: number;
  category: Category;
  fromAddress: string;
  fromName: string;
  subject: string;
  date: string;
  html: string | null;
  text: string;
}

export interface MessagesResponse {
  category: Category;
  messages: MailMessage[];
  loginEmail: string;
  fetchedAt: string;
}
