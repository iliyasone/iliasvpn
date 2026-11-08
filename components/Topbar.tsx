import Link from "next/link";
import { currentViewer } from "@/lib/session";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

/** Page header: back link or wordmark on the left; the theme switch and the signed-in key's avatar on the right. */
export async function Topbar({ back, title = "iliasvpn" }: { back?: string; title?: string }) {
  const viewer = await currentViewer();
  return (
    <div className="topbar">
      {back ? (
        <Link href={back} className="back">
          ← Назад
        </Link>
      ) : (
        <span className="wordmark">{title}</span>
      )}
      <div className="topbar-right">
        <ThemeToggle />
        {viewer ? (
          <UserMenu name={viewer.name} telegram={viewer.telegram} color={viewer.color} admin={viewer.admin} />
        ) : (
          back && <span className="wordmark">{title}</span>
        )}
      </div>
    </div>
  );
}
