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
  date: string;
  preview: string;
  code?: string;
  loginUrl?: string;
  loginClient?: string;
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
