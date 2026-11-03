import Link from "next/link";
import { currentViewer } from "@/lib/session";
import { UserMenu } from "./UserMenu";

/** Page header: back link or wordmark on the left, who is signed in on the right (or `as`, e.g. a Claude Code key). */
export async function Topbar({
  back,
  title = "iliasvpn",
  as,
}: {
  back?: string;
  title?: string;
  as?: { name: string; telegram?: string };
}) {
  const viewer = as ? { ...as, kind: "key" as const } : await currentViewer();
  return (
    <div className="topbar">
      {back ? (
        <Link href={back} className="back">
          ← Назад
        </Link>
      ) : (
        <span className="wordmark">{title}</span>
      )}
      {viewer ? (
        <UserMenu name={viewer.name} telegram={viewer.telegram} admin={viewer.kind === "admin"} />
      ) : (
        back && <span className="wordmark">{title}</span>
      )}
    </div>
  );
}
