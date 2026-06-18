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
}

export const CORE_INSTALL_LINKS: InstallLink[] = [
  {
    platform: "android",
    label: "Android",
    hint: "Google Play",
    url: "https://play.google.com/store/apps/details?id=com.blancvpn.app",
  },
  {
    platform: "ios",
    label: "iPhone",
    hint: "App Store",
    url: "https://apps.apple.com/us/app/blancvpn/id6744585772",
  },
  {
    platform: "macos",
    label: "macOS",
    hint: "Mac App Store",
    url: "https://apps.apple.com/us/app/blancvpn/id6744585772",
  },
];

export const EXTRA_INSTALL_LINKS: InstallLink[] = [
  {
    platform: "chrome",
    label: "Chrome",
    hint: "Расширение",
    url: "https://chromewebstore.google.com/detail/fbnnaeejnbpbbkmnieomfamekibceoob",
  },
  {
    platform: "all",
    label: "Все устройства",
    hint: "blancvpn.app/install",
    url: "https://blancvpn.app/install",
  },
];
