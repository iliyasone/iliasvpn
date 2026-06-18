export type Platform =
  | "android"
  | "ios"
  | "macos"
  | "windows"
  | "chrome"
  | "all";

export interface InstallLink {
  platform: Platform;
  label: string;
  hint: string;
  url: string;
  icon: string;
}

/**
 * BlancVPN download targets. Verified store links plus the universal
 * blancvpn.app/install page. Android / iPhone / macOS are the "core" three
 * we surface first (the user's detected device is moved to the very front).
 */
export const CORE_INSTALL_LINKS: InstallLink[] = [
  {
    platform: "android",
    label: "Android",
    hint: "Google Play",
    url: "https://play.google.com/store/apps/details?id=com.blancvpn.app",
    icon: "🤖",
  },
  {
    platform: "ios",
    label: "iPhone & iPad",
    hint: "App Store",
    url: "https://apps.apple.com/us/app/blancvpn/id6744585772",
    icon: "📱",
  },
  {
    platform: "macos",
    label: "macOS",
    hint: "Mac App Store",
    url: "https://apps.apple.com/us/app/blancvpn/id6744585772",
    icon: "💻",
  },
];

export const EXTRA_INSTALL_LINKS: InstallLink[] = [
  {
    platform: "chrome",
    label: "Chrome",
    hint: "Browser extension",
    url: "https://chromewebstore.google.com/detail/fbnnaeejnbpbbkmnieomfamekibceoob",
    icon: "🧩",
  },
  {
    platform: "all",
    label: "All devices",
    hint: "blancvpn.app/install",
    url: "https://blancvpn.app/install",
    icon: "🌐",
  },
];
