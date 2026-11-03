import { Topbar } from "./Topbar";

const TG_URL = "https://t.me/iliyasone";

/** No key in this browser, or the key does not open this page. */
export function Locked({ logo, alt, signedIn, bad }: { logo?: string; alt?: string; signedIn: boolean; bad?: boolean }) {
  return (
    <div className="container">
      <Topbar back="/" />

      {logo && (
        <div className="flow-head">
          <img src={logo} alt={alt} />
        </div>
      )}

      <section className="section locked">
        <p className="locked-title">{signedIn ? "Этот раздел вам не открыт" : "Вход по личной ссылке"}</p>
        <p className="locked-note">
          {signedIn ? "Напишите Ильясу в Telegram, чтобы получить доступ." : "Откройте свою ссылку или вставьте ключ. Нет ключа — напишите Ильясу в Telegram."}
        </p>
        {!signedIn && (
          <form className="admin-login" method="get">
            <input className="gate-input" type="password" name="key" placeholder="sk-hub-…" autoComplete="off" />
            {bad && <p className="admin-error">Ключ не найден или отозван.</p>}
            <button className="btn btn-dark gate-submit" type="submit">
              Войти
            </button>
          </form>
        )}
        <a className="btn btn-outline" href={TG_URL} target="_blank" rel="noopener noreferrer">
          Написать Ильясу →
        </a>
      </section>
    </div>
  );
}
