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

  // Move the detected device to the front of the core three.
  const core = [...CORE_INSTALL_LINKS].sort((a, b) => {
    if (a.platform === detected) return -1;
    if (b.platform === detected) return 1;
    return 0;
  });

  return (
    <div className="install-grid">
      {core.map((link) => (
        <InstallCard
          key={link.platform}
          link={link}
          highlighted={link.platform === detected}
        />
      ))}
      {EXTRA_INSTALL_LINKS.map((link) => (
        <InstallCard key={link.platform} link={link} highlighted={false} />
      ))}
    </div>
  );
}

function InstallCard({
  link,
  highlighted,
}: {
  link: InstallLink;
  highlighted: boolean;
}) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`install-card ${highlighted ? "install-card-active" : ""}`}
    >
      <span className="install-icon" aria-hidden>
        {link.icon}
      </span>
      <span className="install-text">
        <span className="install-label">{link.label}</span>
        <span className="install-hint">{link.hint}</span>
      </span>
      {highlighted && <span className="install-badge">ваше устройство</span>}
    </a>
  );
}
