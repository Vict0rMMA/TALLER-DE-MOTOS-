import { cn } from '@/lib/utils';

interface AuthColombiaBadgeProps {
  className?: string;
  showCopyright?: boolean;
}

export function AuthColombiaBadge({ className, showCopyright = false }: AuthColombiaBadgeProps) {
  return (
    <div className={cn('auth-colombia-badge', className)}>
      <span className="auth-colombia-flag" aria-hidden>
        🇨🇴
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight text-zinc-200">Hecho en Colombia</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
          Soporte local, para talleres como el tuyo.
        </p>
        {showCopyright ? (
          <p className="mt-2 text-[11px] text-zinc-600">© 2026 MotoBrain AI</p>
        ) : null}
      </div>
    </div>
  );
}
