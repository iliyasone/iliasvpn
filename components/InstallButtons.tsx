"use client";

import { useEffect, useState } from "react";
import {
  CORE_INSTALL_LINKS,
  EXTRA_INSTALL_LINKS,
  type InstallLink,
  type Platform,
} from "@/lib/install-links";

function detectPlatform(): Platform | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/macintosh|mac os x/i.test(ua)) return "macos";
  if (/windows/i.test(ua)) return "windows";
  return null;
}

export function InstallButtons() {
  const [detected, setDetected] = useState<Platform | null>(null);

  useEffect(() => {
    setDetected(detectPlatform());
  }, []);

  const core = [...CORE_INSTALL_LINKS].sort((a, b) => {
    if (a.platform === detected) return -1;
    if (b.platform === detected) return 1;
    return 0;
  });

  return (
    <div className="install-links">
      {core.map((link) => (
        <Chip
          key={link.platform}
          link={link}
          active={link.platform === detected}
        />
      ))}
      {EXTRA_INSTALL_LINKS.map((link) => (
        <Chip key={link.platform} link={link} active={false} />
      ))}
    </div>
  );
}

function Chip({ link, active }: { link: InstallLink; active: boolean }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`install-link ${active ? "install-link-active" : ""}`}
    >
      {link.label}
      <span>{link.hint}</span>
    </a>
  );
}
