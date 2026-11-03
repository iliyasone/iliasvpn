import type { ReactNode } from "react";
import { Topbar } from "./Topbar";

const TG_URL = "https://t.me/iliyasone";

export function Locked({
  logo,
  alt,
  signedIn = false,
  children,
}: {
  logo: string;
  alt: string;
  signedIn?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="container">
      <Topbar back="/" />

      <div className="flow-head">
        <img src={logo} alt={alt} />
      </div>

      <section className="section locked">
        <p className="locked-title">{signedIn ? "Этот раздел вам не открыт" : "Доступ по приглашению"}</p>
        <p className="locked-note">
          Напишите Ильясу в Telegram, чтобы получить доступ.
        </p>
        <a
          className="btn btn-dark"
          href={TG_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Написать Ильясу →
        </a>
      </section>
      {children}
    </div>
  );
}
