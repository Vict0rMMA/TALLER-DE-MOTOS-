'use client';

import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function formatWithDots(num: number): string {
  if (!num) return '';
  return Math.round(num).toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

export function CurrencyInput({ value, onChange, placeholder = '0', className, disabled }: CurrencyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    onChange(Number(digits) || 0);
  };

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">$</span>
      <input
        type="text"
        inputMode="numeric"
        value={formatWithDots(value)}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg border border-border bg-bg-elevated py-2 pl-7 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors',
          className,
        )}
      />
    </div>
  );
}
