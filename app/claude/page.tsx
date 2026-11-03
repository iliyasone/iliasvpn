import { AgentPage } from "@/components/AgentPage";
import { Locked } from "@/components/Locked";
import { currentViewer, viewerCan } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ClaudePage({ searchParams }: { searchParams: Promise<{ bad?: string }> }) {
  const viewer = await currentViewer();
  if (!viewer || !viewerCan(viewer, "claude")) {
    const { bad } = await searchParams;
    return <Locked logo="/logos/claude.png" alt="Claude" signedIn={Boolean(viewer)} bad={Boolean(bad)} />;
  }
  return <AgentPage me={viewer.me} />;
}
