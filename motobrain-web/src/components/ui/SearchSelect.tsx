'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchSelectOption {
  value: string;
  label: string;
  /** Segunda línea (cédula, placa, marca…). También se busca por aquí. */
  hint?: string;
}

export interface SearchSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchSelectOption[];
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Si se pasa, la búsqueda también va al servidor (con retardo). */
  onSearchChange?: (query: string) => void;
  'aria-invalid'?: boolean;
  className?: string;
}

/** Sin tildes ni mayúsculas: "Rodríguez" encuentra a "rodriguez". */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

const MAX_VISIBLE = 50;

export function SearchSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Buscar…',
  emptyMessage = 'Sin resultados',
  disabled,
  loading,
  onSearchChange,
  'aria-invalid': ariaInvalid,
  className,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // El seleccionado puede no venir en la lista actual cuando se busca en el
  // servidor, así que recordamos su etiqueta aparte.
  const [pickedLabel, setPickedLabel] = useState('');
  const selected = options.find((o) => o.value === value);
  const selectedLabel = selected?.label ?? pickedLabel;

  useEffect(() => {
    if (selected) setPickedLabel(selected.label);
  }, [selected]);

  useEffect(() => {
    if (!value) setPickedLabel('');
  }, [value]);

  // Búsqueda en el servidor: espera a que deje de escribir.
  useEffect(() => {
    if (!onSearchChange) return;
    const t = setTimeout(() => onSearchChange(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query, onSearchChange]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return options.slice(0, MAX_VISIBLE);
    const terms = q.split(/\s+/);
    return options
      .filter((o) => {
        const haystack = normalize(`${o.label} ${o.hint ?? ''}`);
        return terms.every((t) => haystack.includes(t));
      })
      .slice(0, MAX_VISIBLE);
  }, [options, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Mantiene la opción resaltada a la vista al moverse con el teclado.
  useEffect(() => {
    if (!open) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  function openMenu() {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function pick(option: SearchSelectOption) {
    onChange(option.value);
    setPickedLabel(option.label);
    setQuery('');
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    setPickedLabel('');
    setQuery('');
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const option = filtered[activeIndex];
      if (option) pick(option);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  }

  // Pegar una cédula o una placa completa selecciona de una, sin más clics.
  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = normalize(e.clipboardData.getData('text').trim());
    if (!pasted) return;
    const matches = options.filter((o) =>
      normalize(`${o.label} ${o.hint ?? ''}`).includes(pasted),
    );
    if (matches.length === 1) {
      e.preventDefault();
      pick(matches[0]);
    }
  }

  const controlCls = cn(
    'flex w-full items-center gap-2 rounded-lg border bg-bg-elevated px-3 py-2 text-sm transition-colors',
    ariaInvalid ? 'border-danger' : 'border-border',
    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-text hover:border-text-tertiary',
  );

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {open ? (
        <div className={cn(controlCls, 'border-accent ring-1 ring-accent')}>
          <Search className="h-4 w-4 shrink-0 text-text-tertiary" />
          <input
            ref={inputRef}
            id={id}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            placeholder={selectedLabel || placeholder}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          {loading && <span className="shrink-0 text-xs text-text-tertiary">Buscando…</span>}
        </div>
      ) : (
        <div
          id={id}
          role="combobox"
          aria-expanded={false}
          aria-controls={`${id ?? 'search'}-list`}
          tabIndex={disabled ? -1 : 0}
          onClick={openMenu}
          onFocus={openMenu}
          className={controlCls}
        >
          <span
            className={cn(
              'min-w-0 flex-1 truncate',
              selectedLabel ? 'text-text-primary' : 'text-text-tertiary',
            )}
          >
            {selectedLabel || placeholder}
          </span>
          {selectedLabel && !disabled && (
            <button
              type="button"
              onClick={clear}
              aria-label="Quitar selección"
              className="shrink-0 rounded p-0.5 text-text-tertiary hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 text-text-tertiary" />
        </div>
      )}

      {open && (
        <ul
          ref={listRef}
          id={`${id ?? 'search'}-list`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto overscroll-contain rounded-lg border border-border bg-bg-elevated py-1 shadow-xl"
        >
          {filtered.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-text-tertiary">
              {loading ? 'Buscando…' : emptyMessage}
            </li>
          )}
          {filtered.map((option, i) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => pick(option)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
                  i === activeIndex ? 'bg-bg-tertiary' : 'bg-transparent',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-text-primary">{option.label}</span>
                  {option.hint && (
                    <span className="block truncate text-xs text-text-tertiary">{option.hint}</span>
                  )}
                </span>
                {option.value === value && (
                  <Check className="h-4 w-4 shrink-0 text-accent" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
