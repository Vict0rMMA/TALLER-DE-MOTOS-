'use client';

import { useEffect, useState } from 'react';
import { Loader2, X, CheckCircle2, CalendarClock, Bike } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { portalApi } from '@/lib/portal-api-client';
import { SearchSelect } from '@/components/ui/SearchSelect';

interface Motorcycle {
  id: string;
  placa: string;
  brand: string;
  model: string;
}

interface PortalScheduleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motorcycles: Motorcycle[];
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const QUICK_DATES = [
  { label: 'Hoy', offset: 0 },
  { label: 'Mañana', offset: 1 },
  { label: 'En una semana', offset: 7 },
];

const NOTE_SUGGESTIONS = ['Cambio de aceite', 'Revisión general', 'Frenos', 'Ruido extraño'];

export function PortalScheduleSheet({ open, onOpenChange, motorcycles }: PortalScheduleSheetProps) {
  const queryClient = useQueryClient();
  const [motoId, setMotoId] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open && motorcycles.length === 1) {
      setMotoId(motorcycles[0].id);
    }
  }, [open, motorcycles]);

  if (!open) return null;

  const selectedMoto = motorcycles.find((m) => m.id === motoId);

  function toggleNote(tag: string) {
    setNotes((current) => {
      if (current.includes(tag)) {
        return current
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s && s !== tag)
          .join(', ');
      }
      return current ? `${current}, ${tag}` : tag;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await portalApi.post<{ message: string }>('/schedule-revision', {
        motorcycleId: motoId || undefined,
        preferredDate: preferredDate || undefined,
        notes: notes.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['portal-dashboard'] });
      setSuccess(res.message);
      setNotes('');
      setPreferredDate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSuccess('');
    setError('');
    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Cerrar"
        onClick={handleClose}
      />
      <div className="relative z-10 flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 p-5 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <CalendarClock className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Agendar revisión</h2>
              <p className="text-xs text-zinc-500">El taller te confirma el horario</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain p-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        {success ? (
          <div className="space-y-4 py-2 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
            <p className="text-sm leading-relaxed text-zinc-200">{success}</p>
            <button type="button" onClick={handleClose} className="portal-btn-primary w-full justify-center">
              Listo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {motorcycles.length > 1 ? (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-zinc-400">Moto</span>
                <SearchSelect
                  id="schedule-moto"
                  value={motoId}
                  onChange={setMotoId}
                  options={motorcycles.map((m) => ({
                    value: m.id,
                    label: m.placa,
                    hint: `${m.brand} ${m.model}`,
                  }))}
                  placeholder="Selecciona una moto"
                  emptyMessage="Ninguna moto coincide"
                />
              </label>
            ) : selectedMoto ? (
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-zinc-400">Moto</span>
                <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5">
                  <Bike className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="font-mono text-sm font-semibold tracking-wider text-white">
                    {selectedMoto.placa}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {selectedMoto.brand} {selectedMoto.model}
                  </span>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-200/90">
                Primero agrega una moto para indicar cuál quieres revisar.
              </p>
            )}

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">¿Cuándo te sirve? (opcional)</span>
              <div className="flex flex-wrap gap-2">
                {QUICK_DATES.map(({ label, offset }) => {
                  const iso = toISODate(new Date(Date.now() + offset * 86400000));
                  const active = preferredDate === iso;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setPreferredDate(active ? '' : iso)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="portal-input w-full"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">¿Qué le vas a hacer? (opcional)</span>
              <div className="flex flex-wrap gap-2">
                {NOTE_SUGGESTIONS.map((tag) => {
                  const active = notes.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleNote(tag)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="portal-input w-full resize-none"
                placeholder="Agrega más detalle si quieres…"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || motorcycles.length === 0}
              className="portal-btn-primary w-full justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar solicitud al taller'}
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
