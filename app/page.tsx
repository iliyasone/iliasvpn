import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <div className="topbar">
        <span className="wordmark">iliasvpn</span>
      </div>

      <div className="home-grid">
        <Link href="/blancvpn" className="home-card home-card-blanc">
          <img src="/logos/blancvpn.png" alt="BlancVPN" />
        </Link>
        <Link href="/claude" className="home-card home-card-claude">
          <img src="/logos/claude.png" alt="Claude" />
        </Link>
      </div>
    </div>
  );
}
