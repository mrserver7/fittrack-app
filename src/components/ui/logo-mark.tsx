"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function LogoMark({ size = 32 }: { size?: number }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === "dark";

  return (
    <span
      style={{
        display: "inline-flex",
        flexShrink: 0,
        width: size,
        height: size,
        position: "relative",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-light.svg"
        alt="FitTrack"
        width={size}
        height={size}
        style={{
          objectFit: "contain",
          position: "absolute",
          top: 0,
          left: 0,
          opacity: dark ? 0 : 1,
          transition: "opacity 0.25s ease",
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-dark.svg"
        alt=""
        aria-hidden
        width={size}
        height={size}
        style={{
          objectFit: "contain",
          position: "absolute",
          top: 0,
          left: 0,
          opacity: dark ? 1 : 0,
          transition: "opacity 0.25s ease",
        }}
      />
    </span>
  );
}
