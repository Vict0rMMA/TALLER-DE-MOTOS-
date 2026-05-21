import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  collapsed?: boolean;
  className?: string;
  variant?: 'default' | 'sidebar';
}

function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden
    >
      <defs>
        <linearGradient id="mb-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="mb-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="40" height="40" rx="11" fill="url(#mb-bg)" />
      <rect width="40" height="20" rx="11" fill="url(#mb-shine)" />

      <path
        d="M9 28V12h4.2l5.3 8.6 5.3-8.6H28V28h-3.8v-9.4L19 26.2h-1.4l-5.2-7.6V28H9z"
        fill="white"
        fillOpacity="0.97"
      />

      <circle cx="32" cy="9" r="2.2" fill="white" fillOpacity="0.5" />
      <circle cx="32" cy="15" r="1.4" fill="white" fillOpacity="0.3" />
      <line x1="32" y1="11.2" x2="32" y2="13.6" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
    </svg>
  );
}

function LogoWordmark({ compact }: { compact?: boolean }) {
  return (
    <span className={cn('flex items-center gap-1.5 select-none', compact ? 'text-[14px]' : 'text-[15px]')}>
      <span className="font-semibold tracking-tight text-[--text-primary]">
        Moto<span className="text-[--accent]">Brain</span>
      </span>
      <span className="hidden sm:inline-flex items-center rounded-md border border-border bg-bg-elevated px-1.5 py-0.5 text-[10px] font-medium leading-none text-text-tertiary">
        Taller
      </span>
    </span>
  );
}

export function BrandLogo({ collapsed, className, variant = 'default' }: BrandLogoProps) {
  if (variant === 'sidebar' && !collapsed) {
    return (
      <Link
        href="/"
        className={cn(
          'flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/40',
          className,
        )}
      >
        <LogoMark size={36} />
        <LogoWordmark />
      </Link>
    );
  }

  if (variant === 'sidebar' && collapsed) {
    return (
      <Link
        href="/"
        className={cn('flex justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[--accent]/40', className)}
        title="MotoBrain AI"
      >
        <LogoMark size={32} />
      </Link>
    );
  }

  return (
    <Link href="/" className={cn('flex items-center gap-2', className)}>
      <LogoMark size={32} />
      {!collapsed && <LogoWordmark compact />}
    </Link>
  );
}
