import Link from "next/link";

export function SiteHeader({ active }: { active?: "blancvpn" | "claude" }) {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-mark">iv</span>
        <span className="brand-name">iliasvpn</span>
      </Link>
      <nav className="site-nav">
        <Link
          href="/blancvpn"
          className={`nav-link ${active === "blancvpn" ? "nav-link-active" : ""}`}
        >
          BlancVPN
        </Link>
        <Link
          href="/claude"
          className={`nav-link ${active === "claude" ? "nav-link-active" : ""}`}
        >
          Claude.ai
        </Link>
      </nav>
    </header>
  );
}
