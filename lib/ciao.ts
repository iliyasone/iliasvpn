import "server-only";

const RELEASES = "https://github.com/iliyasone/ciao/releases/latest";

export interface CiaoDownload {
  label: string;
  hint: string;
  url: string;
}

/** Which file of a release each platform installs. */
const FILES: [RegExp, string, string][] = [
  [/^Ciao-Setup-[\d.]+\.exe$/, "Windows", ".exe"],
  [/^Ciao-[\d.]+-arm64\.dmg$/, "Mac", "Apple Silicon"],
  [/^Ciao-[\d.]+-x64\.dmg$/, "Mac", "Intel"],
  [/^Ciao-[\d.]+\.apk$/, "Android", ".apk"],
  [/^Ciao-[\d.]+\.AppImage$/, "Linux", "AppImage"],
];

/** Download links of the latest Ciao release (checked hourly); the release page if GitHub doesn't answer. */
export async function ciaoDownloads(): Promise<{ version: string | null; links: CiaoDownload[]; page: string }> {
  const res = await fetch("https://api.github.com/repos/iliyasone/ciao/releases/latest", {
    next: { revalidate: 3600 },
  }).catch(() => null);
  const release = res?.ok ? ((await res.json()) as { tag_name: string; assets: { name: string; browser_download_url: string }[] }) : null;
  const links = FILES.flatMap(([re, label, hint]) => {
    const asset = release?.assets.find((a) => re.test(a.name));
    return asset ? [{ label, hint, url: asset.browser_download_url }] : [];
  });
  return { version: release?.tag_name ?? null, links, page: RELEASES };
}
