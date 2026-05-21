'use client';

import {
  extractColombiaLocalPhone,
  formatColombiaLocalDisplay,
  toColombiaE164,
} from '@/lib/phone';
import { cn } from '@/lib/utils';
import { ColombiaFlag } from '@/components/ui/ColombiaFlag';

export interface ColombiaPhoneInputProps {
  id?: string;
  value: string;
  onChange: (e164: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  className?: string;
}

export function ColombiaPhoneInput({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  'aria-invalid': ariaInvalid,
  className,
}: ColombiaPhoneInputProps) {
  const local = extractColombiaLocalPhone(value);
  const display = formatColombiaLocalDisplay(local);

  function handleChange(raw: string) {
    const local = extractColombiaLocalPhone(raw);
    onChange(toColombiaE164(local));
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div
        className={cn(
          'flex overflow-hidden rounded-lg border border-border bg-bg-elevated transition-colors',
          'focus-within:border-accent focus-within:ring-1 focus-within:ring-accent',
          ariaInvalid && 'border-danger focus-within:border-danger focus-within:ring-danger',
          disabled && 'opacity-50',
        )}
      >
        <div
          className="flex shrink-0 items-center gap-2 border-r border-border bg-bg-tertiary px-3 py-2"
          aria-hidden
        >
          <ColombiaFlag size={22} className="shrink-0 rounded-sm ring-1 ring-white/10" />
          <span className="text-sm font-semibold text-text-primary tabular-nums">+57</span>
        </div>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          value={display}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={onBlur}
          placeholder="300 123 4567"
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
        />
      </div>
      <p className="text-xs text-text-tertiary">
        Solo los <span className="font-medium text-text-secondary">10 dígitos</span> del celular
        (sin repetir +57). Debe empezar en <span className="font-medium text-text-secondary">3</span>.
      </p>
    </div>
  );
}
