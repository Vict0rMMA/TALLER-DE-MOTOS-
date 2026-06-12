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

  // Aurora siempre en la esquina inferior — nunca detrás de la letra
  const blobX = 5 + (h % 30);      // 5–35% → esquina izquierda-abajo
  const blob2X = 65 + (h % 30);    // 65–95% → esquina derecha-abajo
  const blobOpacity = 0.55 + ((h >> 8) % 20) / 100;

  return (
    <div
      role="img"
      aria-label={name || "Moto"}
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#050c07]",
        className,
      )}
    >
      {/* Aurora fijo en la parte baja, lejos de la letra */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            `radial-gradient(55% 45% at ${blobX}% 100%, rgba(5,120,80,${blobOpacity}), transparent 70%)`,
            `radial-gradient(45% 40% at ${blob2X}% 100%, rgba(16,185,129,0.30), transparent 65%)`,
          ].join(", "),
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none relative z-10 select-none text-[6rem] font-bold leading-none text-emerald-400"
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
