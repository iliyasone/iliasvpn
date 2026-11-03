import Link from "next/link";
import { currentViewer } from "@/lib/session";
import { UserMenu } from "./UserMenu";

/** Page header: back link or wordmark on the left, who is signed in on the right. */
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
      {viewer ? (
        <UserMenu name={viewer.name} telegram={viewer.telegram} admin={viewer.kind === "admin"} />
      ) : (
        back && <span className="wordmark">{title}</span>
      )}
    </div>
  );
}
