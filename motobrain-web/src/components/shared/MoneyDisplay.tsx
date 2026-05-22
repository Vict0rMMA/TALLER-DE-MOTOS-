import { cn, formatCOP, formatCOPCompact } from '@/lib/utils';

interface MoneyDisplayProps {
  value: number;
  className?: string;
  /** En móvil muestra formato compacto ($2,4 M) y el completo desde sm. */
  responsive?: boolean;
}

export function MoneyDisplay({ value, className, responsive = true }: MoneyDisplayProps) {
  const amount = Number.isFinite(value) ? value : 0;

  if (responsive) {
    return (
      <span
        className={cn(
          'money-display inline-block max-w-full font-mono font-semibold tabular-nums leading-tight',
          className,
        )}
        title={formatCOP(amount)}
      >
        <span className="md:hidden">{formatCOPCompact(amount)}</span>
        <span className="hidden md:inline">{formatCOP(amount)}</span>
      </span>
    );
  }

  return (
    <span className={cn('font-mono font-medium tabular-nums', className)}>{formatCOP(amount)}</span>
  );
}
