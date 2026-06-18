'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, X, ArrowLeft } from 'lucide-react';
import { portalApi } from '@/lib/portal-api-client';

interface PortalAppointment {
  id: string;
  notes: string | null;
  preferredDate: string | null;
  scheduledAt: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  motorcycle: { placa: string; brand: string; model: string } | null;
}

interface DashData {
  appointments: PortalAppointment[];
}

const APPT_STATUS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

function fmtApptWhen(a: PortalAppointment) {
  const d = a.scheduledAt ?? a.preferredDate;
  if (!d) return 'Por definir';
  const s = new Date(d).toLocaleString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function PortalCitasPage() {
  const qc = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [limit, setLimit] = useState(5);

  const { data, isLoading } = useQuery<DashData>({
    queryKey: ['portal-dashboard'],
    queryFn: () => portalApi.get<DashData>('/dashboard'),
    staleTime: 30_000,
  });

  const cancelAppt = useMutation({
    mutationFn: (id: string) => portalApi.patch(`/appointments/${id}/cancel`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['portal-dashboard'] });
      setCancellingId(null);
    },
    onError: () => setCancellingId(null),
  });

  const appointments = data?.appointments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/portal"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition-colors hover:text-white"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Mis citas</h1>
          <p className="text-xs text-zinc-500">Citas agendadas y su estado</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-16 animate-pulse rounded-2xl bg-zinc-800/60" />
          <div className="h-16 animate-pulse rounded-2xl bg-zinc-800/60" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-5 py-12 text-center">
          <Calendar className="mx-auto mb-3 h-8 w-8 text-zinc-600" strokeWidth={1.5} />
          <p className="font-medium text-zinc-300">No tienes citas</p>
          <p className="mt-1 text-sm text-zinc-600">Agenda una revisión desde el inicio.</p>
          <Link href="/portal" className="mt-4 inline-flex rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20">
            Ir al inicio
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
          {appointments.slice(0, limit).map((a, i) => (
            <div key={a.id} className={`flex items-start gap-3 px-4 py-3.5 ${i !== 0 ? 'border-t border-zinc-800/80' : ''}`}>
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                <Clock className="h-4 w-4 text-sky-400/70" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {a.motorcycle ? `${a.motorcycle.placa} · ${a.motorcycle.brand}` : 'Revisión general'}
                </p>
                <p className="text-[11px] text-zinc-500">{fmtApptWhen(a)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  a.status === 'confirmed'
                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                    : a.status === 'cancelled'
                      ? 'border-zinc-700/50 bg-zinc-800/50 text-zinc-500'
                      : 'border-amber-500/25 bg-amber-500/10 text-amber-400'
                }`}>
                  {APPT_STATUS[a.status]}
                </span>
                {(a.status === 'pending' || a.status === 'confirmed') && (
                  cancellingId === a.id ? (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCancellingId(null)}
                        className="rounded-lg border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-200"
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelAppt.mutate(a.id)}
                        disabled={cancelAppt.isPending}
                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        {cancelAppt.isPending ? '...' : 'Sí, cancelar'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCancellingId(a.id)}
                      className="flex items-center gap-1 text-[10px] text-zinc-600 transition-colors hover:text-red-400"
                    >
                      <X className="h-3 w-3" /> Cancelar
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
          {appointments.length > 5 && (
            <button
              type="button"
              onClick={() => setLimit((n) => (n >= appointments.length ? 5 : n + 5))}
              className="flex w-full items-center justify-center border-t border-zinc-800/80 px-4 py-3 text-xs font-medium text-emerald-400 transition-colors hover:bg-zinc-800/40"
            >
              {limit >= appointments.length ? 'Ver menos' : `Ver ${Math.min(5, appointments.length - limit)} más`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
