import { GeminiPage } from "@/components/GeminiPage";
import { Locked } from "@/components/Locked";
import { currentViewer, viewerCan } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Gemini({ searchParams }: { searchParams: Promise<{ bad?: string }> }) {
  const viewer = await currentViewer();
  if (!viewer || !viewerCan(viewer, "gemini")) {
    const { bad } = await searchParams;
    return <Locked logo="/logos/ciao.svg" alt="Ciao" signedIn={Boolean(viewer)} bad={Boolean(bad)} />;
  }
  return <GeminiPage me={viewer.me} />;
}
