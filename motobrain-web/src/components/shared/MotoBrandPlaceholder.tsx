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

export const MotoBrandPlaceholder = memo(function MotoBrandPlaceholder({
  brand,
  className,
}: MotoBrandPlaceholderProps) {
  const name = (brand ?? "").trim();
  const initial = name ? name[0].toUpperCase() : "•";
  const h = hashBrand(name.toLowerCase() || "moto");

  const blobX = 10 + (h % 35);
  const blobY = 85 + ((h >> 4) % 30);
  const blob2X = 75 + ((h >> 8) % 22);
  const opacity = 0.4 + ((h >> 12) % 20) / 100;

  return (
    <div
      role="img"
      aria-label={name || "Moto"}
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-end overflow-hidden bg-[#0c0e0d]",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: [
            `radial-gradient(70% 80% at ${blobX}% ${blobY}%, rgba(5,150,105,${opacity}), transparent 70%)`,
            `radial-gradient(60% 70% at ${blob2X}% -8%, rgba(52,211,153,0.28), transparent 70%)`,
          ].join(", "),
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none relative select-none bg-gradient-to-b from-emerald-500 to-emerald-800 bg-clip-text text-[8rem] font-bold leading-none text-transparent"
      >
        {initial}
      </span>
      {name && (
        <span className="relative mb-4 -mt-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-zinc-500">
          {name}
        </span>
      )}
    </div>
  );
});
