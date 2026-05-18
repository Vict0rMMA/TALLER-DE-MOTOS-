'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function formatWithDots(num: number): string {
  if (!num && num !== 0) return '';
  return Math.round(num).toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

function parseRaw(str: string): number {
  const cleaned = str.replace(/\./g, '').replace(/,/g, '').replace(/\$/g, '').trim();
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

export function CurrencyInput({ value, onChange, placeholder = '0', className, disabled }: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState('');

  useEffect(() => {
    if (!focused) {
      setRaw(value > 0 ? formatWithDots(value) : '');
    }
  }, [value, focused]);

  const handleFocus = () => {
    setFocused(true);
    setRaw(value > 0 ? String(Math.round(value)) : '');
  };

  const handleBlur = () => {
    setFocused(false);
    const num = parseRaw(raw);
    onChange(num);
    setRaw(num > 0 ? formatWithDots(num) : '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^0-9]/g, '');
    setRaw(input);
    onChange(Number(input) || 0);
  };

  const displayValue = focused ? raw : (value > 0 ? formatWithDots(value) : '');

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">$</span>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
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
