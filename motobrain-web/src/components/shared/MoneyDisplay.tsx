import { cn, formatCOP, formatCOPCompact } from '@/lib/utils';

interface MoneyDisplayProps {
  value: number;
  className?: string;
  /** En móvil muestra formato compacto ($2,4 M) y el completo desde sm. */
  responsive?: boolean;
}

export function MoneyDisplay({ value, className, responsive = true }: MoneyDisplayProps) {
  if (responsive) {
    return (
      <span
        className={cn(
          'money-display inline-block max-w-full font-mono font-semibold tabular-nums leading-tight',
          className,
        )}
        title={formatCOP(value)}
      >
        <span className="md:hidden">{formatCOPCompact(value)}</span>
        <span className="hidden md:inline">{formatCOP(value)}</span>
      </span>
    );
  }

  return (
    <span className={cn('font-mono font-medium tabular-nums', className)}>{formatCOP(value)}</span>
  );
}
