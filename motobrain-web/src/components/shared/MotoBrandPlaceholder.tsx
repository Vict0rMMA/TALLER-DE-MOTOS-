"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

function hashBrand(brand: string): number {
  let h = 0;
  for (let i = 0; i < brand.length; i++) h = (h * 31 + brand.charCodeAt(i)) >>> 0;
  return h;
}

interface MotoBrandPlaceholderProps {
  brand?: string;
  className?: string;
}

const BG_VARIANTS = [
  "linear-gradient(135deg,#0d2016 0%,#060c08 100%)",
  "linear-gradient(135deg,#0a1e14 0%,#050b07 100%)",
  "linear-gradient(135deg,#0f2318 0%,#07100a 100%)",
  "linear-gradient(135deg,#081a10 0%,#040a06 100%)",
];

export const MotoBrandPlaceholder = memo(function MotoBrandPlaceholder({
  brand,
  className,
}: MotoBrandPlaceholderProps) {
  const name = (brand ?? "").trim();
  const initial = name ? name[0].toUpperCase() : "•";
  const h = hashBrand(name.toLowerCase() || "moto");
  const bg = BG_VARIANTS[h % BG_VARIANTS.length];

  return (
    <div
      role="img"
      aria-label={name || "Moto"}
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center overflow-hidden",
        className,
      )}
      style={{ background: bg }}
    >
      <span className="pointer-events-none select-none text-[5.5rem] font-bold leading-none text-emerald-500">
        {initial}
      </span>
      {name && (
        <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.4em] text-zinc-500">
          {name}
        </span>
      )}
    </div>
  );
});
