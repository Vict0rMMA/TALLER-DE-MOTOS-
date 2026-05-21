import { cn } from '@/lib/utils';
import { ColombiaFlag } from '@/components/ui/ColombiaFlag';

interface AuthColombiaBadgeProps {
  className?: string;
  showCopyright?: boolean;
}

export function AuthColombiaBadge({ className, showCopyright = false }: AuthColombiaBadgeProps) {
  return (
    <div
      className={cn(
        'relative w-full max-w-[340px] overflow-hidden rounded-2xl',
        'border border-white/[0.07] bg-zinc-950/50 backdrop-blur-sm',
        className,
      )}
    >
      {/* Franja tricolor Colombia */}
      <div className="flex h-1 w-full" aria-hidden>
        <span className="flex-[2] bg-[#FCD116]" />
        <span className="flex-1 bg-[#003893]" />
        <span className="flex-1 bg-[#CE1126]" />
      </div>

      <div className="flex items-center gap-4 px-4 py-3.5">
        <div className="shrink-0 overflow-hidden rounded-md shadow-lg shadow-black/40 ring-1 ring-white/15">
          <ColombiaFlag size={44} className="block rounded-none ring-0" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold tracking-tight text-zinc-100">
            Hecho en Colombia
          </p>
          <p className="mt-1 text-[12px] leading-snug text-zinc-500 text-pretty">
            Soporte local para talleres de motos
          </p>
          {showCopyright ? (
            <p className="mt-2 text-[11px] text-zinc-600">© 2026 MotoBrain AI</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
