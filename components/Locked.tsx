import Link from "next/link";

const TG_URL = "https://t.me/iliyasone";

export function Locked({ logo, alt }: { logo: string; alt: string }) {
  return (
    <div className="container">
      <div className="topbar">
        <Link href="/" className="back">
          ← Назад
        </Link>
        <span className="wordmark">iliasvpn</span>
      </div>

      <div className="flow-head">
        <img src={logo} alt={alt} />
      </div>

      <section className="section locked">
        <p className="locked-title">Доступ по приглашению</p>
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
    </div>
  );
}
