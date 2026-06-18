'use client';

import { useEffect, useState } from 'react';
import { Loader2, X, CheckCircle2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { portalApi } from '@/lib/portal-api-client';

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
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-lg font-semibold text-white">Agendar revisión</h2>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {motorcycles.length > 0 ? (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-zinc-400">Moto</span>
                <select
                  value={motoId}
                  onChange={(e) => setMotoId(e.target.value)}
                  className="portal-input w-full"
                >
                  <option value="">Selecciona una moto</option>
                  {motorcycles.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.placa} — {m.brand} {m.model}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-200/90">
                Primero agrega una moto para indicar cuál quieres revisar.
              </p>
            )}
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">Fecha preferida (opcional)</span>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="portal-input w-full"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">Notas (opcional)</span>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="portal-input w-full resize-none"
                placeholder="Ej: revisión general, cambio de aceite..."
              />
            </label>
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
