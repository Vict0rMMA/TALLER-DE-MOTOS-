"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

const BRAND_COLORS: Record<string, [string, string]> = {
  yamaha:      ["#1a1a2e", "#6366f1"],
  honda:       ["#1a0a0a", "#ef4444"],
  suzuki:      ["#1a100a", "#f97316"],
  kawasaki:    ["#0a1a0a", "#22c55e"],
  akt:         ["#0a0f1a", "#3b82f6"],
  bajaj:       ["#1a0a1a", "#a855f7"],
  tvs:         ["#1a1500", "#eab308"],
  "royal enfield": ["#0f0f0f", "#d97706"],
  ktm:         ["#1a0800", "#f97316"],
  bws:         ["#0a1a16", "#10b981"],
};

function getBrandColors(brand?: string): [string, string] {
  const key = (brand ?? "").toLowerCase();
  for (const [k, v] of Object.entries(BRAND_COLORS)) {
    if (key.includes(k)) return v;
  }
  return ["#0f1a0f", "#10b981"];
}

function getBrandAbbr(brand?: string, model?: string): string {
  const b = (brand ?? "").trim();
  if (!b) return "MT";
  const words = b.split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (b.length >= 3) return b.slice(0, 3).toUpperCase();
  return b.toUpperCase();
}

interface MotorcyclePlaceholderProps {
  brand?: string;
  model?: string;
  className?: string;
}

export const MotorcyclePlaceholder = memo(function MotorcyclePlaceholder({
  brand,
  model,
  className,
}: MotorcyclePlaceholderProps) {
  const [bgColor, accentColor] = getBrandColors(brand);
  const abbr = getBrandAbbr(brand, model);

  return (
    <div
      role="img"
      aria-label={`${brand ?? "Moto"} ${model ?? ""}`.trim()}
      className={cn("relative flex h-full w-full items-center justify-center overflow-hidden", className)}
      style={{ background: `linear-gradient(135deg, ${bgColor} 0%, #09090b 100%)` }}
    >
      {/* Glow radial */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 65% 60% at 50% 55%, ${accentColor}22, transparent 70%)`,
        }}
      />
      {/* Anillo exterior difuso */}
      <div
        aria-hidden
        className="absolute h-24 w-24 rounded-full"
        style={{
          background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
          filter: "blur(12px)",
        }}
      />
      {/* Iniciales */}
      <span
        className="relative z-10 select-none font-bold tracking-widest"
        style={{
          fontSize: "clamp(1.4rem, 5vw, 2rem)",
          color: accentColor,
          textShadow: `0 0 24px ${accentColor}80`,
          opacity: 0.85,
        }}
      >
        {abbr}
      </span>
      {/* Línea de piso */}
      <div
        aria-hidden
        className="absolute bottom-[18%] left-1/2 h-px w-1/2 -translate-x-1/2"
        style={{
          background: `linear-gradient(to right, transparent, ${accentColor}40, transparent)`,
        }}
      />
    </div>
  );
});
