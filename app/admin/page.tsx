import { Topbar } from "@/components/Topbar";
import { HubAdmin } from "@/components/HubAdmin";
import { Locked } from "@/components/Locked";
import { HUB_URL } from "@/lib/hub";
import { currentViewer } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ bad?: string }> }) {
  const viewer = await currentViewer();
  if (!viewer?.admin) {
    const { bad } = await searchParams;
    return <Locked signedIn={Boolean(viewer)} bad={Boolean(bad)} />;
  }
  return (
    <div className="container">
      <Topbar back="/" title="iliasvpn · admin" />
      <HubAdmin hub={HUB_URL} />
    </div>
  );
}
