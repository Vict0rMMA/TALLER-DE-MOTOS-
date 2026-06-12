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

  const blobX = 15 + (h % 40);
  const blobY = 60 + ((h >> 4) % 40);
  const blob2X = 60 + ((h >> 8) % 30);
  const opacity = 0.45 + ((h >> 12) % 20) / 100;

  return (
    <div
      role="img"
      aria-label={name || "Moto"}
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#070e09]",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: [
            `radial-gradient(70% 70% at ${blobX}% ${blobY}%, rgba(4,108,72,${opacity}), transparent 65%)`,
            `radial-gradient(50% 55% at ${blob2X}% 10%, rgba(16,185,129,0.20), transparent 60%)`,
          ].join(", "),
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none relative z-10 select-none text-[5.5rem] font-bold leading-none text-emerald-600"
      >
        {initial}
      </span>
      {name && (
        <span className="relative z-10 mt-2 text-[10px] font-medium uppercase tracking-[0.4em] text-zinc-500">
          {name}
        </span>
      )}
    </div>
  );
});
