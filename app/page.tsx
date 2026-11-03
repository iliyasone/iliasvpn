import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { currentViewer, viewerCan } from "@/lib/session";

export default async function HomePage() {
  const viewer = await currentViewer();
  const show = (s: "blancvpn" | "claude" | "gemini") => !viewer || viewerCan(viewer, s);

  return (
    <div className="container">
      <Topbar />

      <div className="home-grid">
        {show("blancvpn") && (
          <Link href="/blancvpn" className="home-card home-card-blanc">
            <img src="/logos/blancvpn.png" alt="BlancVPN" />
          </Link>
        )}
        {show("claude") && (
          <Link href="/claude" className="home-card home-card-claude">
            <img src="/logos/claude.png" alt="Claude" />
          </Link>
        )}
        {show("gemini") && (
          <Link href="/gemini" className="home-card home-card-gemini">
            <img src="/logos/gemini.svg" alt="Gemini" />
          </Link>
        )}
      </div>
    </div>
  );
}
