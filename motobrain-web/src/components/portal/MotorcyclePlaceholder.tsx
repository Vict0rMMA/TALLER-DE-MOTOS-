"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

export type MotoType = "scooter" | "sport" | "naked";

const TYPE_KEYWORDS: Record<MotoType, string[]> = {
  scooter: [
    "nmax", "pcx", "agility", "like", "address", "burgman", "dio", "click", "adv",
    "bws", "jog", "beat", "scoopy", "vario", "aerox", "xmax", "tmax", "forza",
  ],
  sport: [
    "r15", "r3", "cbr", "ninja", "gixxer sf", "rs 200", "gsx-r", "rc ",
    "rr", "r6", "r1", "zx", "yzf",
  ],
  naked: [
    "fz", "mt", "duke", "dominar", "ns", "pulsar", "gixxer", "cb ", "twister",
    "xtz", "tt ", "ttr", "fazer", "akt", "tx", "200u", "150u", "125u",
    "tornado", "cg ", "gl ", "xre", "proto", "rouser",
  ],
};

export function inferMotoType(brand?: string, model?: string): MotoType {
  const text = `${brand ?? ""} ${model ?? ""}`.toLowerCase();
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS) as [MotoType, string[]][]) {
    if (keywords.some((k) => text.includes(k))) return type;
  }
  return "naked";
}

const SILHOUETTES: Record<MotoType, JSX.Element> = {
  scooter: (
    <g>
      <circle cx="22" cy="74" r="13" />
      <circle cx="98" cy="74" r="13" />
      <path d="M22 74h28l14-22h18c8 0 14 6 16 14l2 8" />
      <path d="M50 74c2-14 8-22 14-22" />
      <path d="M64 52l-8-24h-12" />
      <path d="M44 28l-4-6" />
      <path d="M82 52c10 0 16 4 20 10" />
    </g>
  ),
  sport: (
    <g>
      <circle cx="22" cy="74" r="13" />
      <circle cx="98" cy="74" r="13" />
      <path d="M22 74l20-30c4-6 10-10 18-10h14l24 26v14" />
      <path d="M60 34l34 4-6 10" />
      <path d="M42 44l-12-8" />
      <path d="M52 74h36" />
    </g>
  ),
  naked: (
    <g>
      <circle cx="22" cy="74" r="13" />
      <circle cx="98" cy="74" r="13" />
      <path d="M22 74l18-26h24l20 14 14 12" />
      <path d="M64 48l-10-20" />
      <path d="M48 26h12" />
      <path d="M64 48l24-10 10 8" />
      <path d="M40 74h32" />
    </g>
  ),
};

interface MotorcyclePlaceholderProps {
  brand?: string;
  model?: string;
  type?: MotoType;
  className?: string;
}

export const MotorcyclePlaceholder = memo(function MotorcyclePlaceholder({
  brand,
  model,
  type,
  className,
}: MotorcyclePlaceholderProps) {
  const motoType = type ?? inferMotoType(brand, model);

  return (
    <div
      role="img"
      aria-label={`${brand ?? "Moto"} ${model ?? ""}`.trim()}
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        "bg-gradient-to-br from-zinc-900 via-zinc-950 to-black",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 58%, rgba(16,185,129,0.16), rgba(6,182,212,0.06) 55%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="absolute bottom-[22%] left-1/2 h-px w-3/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent"
      />
      <svg
        viewBox="0 0 120 96"
        className="relative w-[55%] max-w-[220px] text-emerald-400/80 drop-shadow-[0_0_18px_rgba(16,185,129,0.25)]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {SILHOUETTES[motoType]}
      </svg>
    </div>
  );
});
