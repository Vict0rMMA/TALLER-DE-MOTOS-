'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, CheckCircle2, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  notes: string | null;
  preferredDate: string | null;
  scheduledAt: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  customer: { id: string; name: string; phone: string };
  motorcycle: { placa: string; brand: string; model: string } | null;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AppointmentCard({
  a,
  onConfirm,
}: {
  a: Appointment;
  onConfirm: (id: string, scheduledAt: string, notes?: string) => void;
}) {
  const [expanded, setExpanded] = useState(a.status === 'pending');
  const [scheduledAt, setScheduledAt] = useState(() => {
    if (a.scheduledAt) return toDatetimeLocalValue(new Date(a.scheduledAt));
    if (a.preferredDate) return toDatetimeLocalValue(new Date(a.preferredDate));
    return toDatetimeLocalValue(new Date());
  });
  const [notes, setNotes] = useState(a.notes ?? '');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm(a.id, new Date(scheduledAt).toISOString(), notes);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className={cn('consultas-card', a.status === 'pending' && 'consultas-card--pending')}>
      <button type="button" onClick={() => setExpanded((e) => !e)} className="consultas-card-header w-full">
        <div className={cn('consultas-avatar', a.status === 'pending' ? 'consultas-avatar--pending' : 'consultas-avatar--done')}>
          <Calendar className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-text-primary">{a.customer.name}</p>
            <span className={cn('consultas-badge', a.status === 'pending' ? 'consultas-badge--pending' : 'consultas-badge--done')}>
              {a.status === 'pending' ? 'Pendiente' : 'Confirmada'}
            </span>
          </div>
          <p className="mt-1 text-xs text-text-tertiary">
            {a.motorcycle ? `${a.motorcycle.placa} · ${a.motorcycle.brand} ${a.motorcycle.model}` : 'Sin moto'} ·{' '}
            {fmtDate(a.createdAt)}
          </p>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-text-tertiary" /> : <ChevronDown className="h-5 w-5 text-text-tertiary" />}
      </button>

      {expanded && (
        <div className="consultas-body">
          <div className="consultas-thread">
            {a.preferredDate && (
              <p className="text-sm text-text-secondary">
                <span className="font-medium text-text-primary">Fecha preferida del cliente:</span>{' '}
                {fmtDate(a.preferredDate)}
              </p>
            )}
            {a.notes && <p className="text-sm text-text-primary">{a.notes}</p>}
            {a.status === 'confirmed' && a.scheduledAt && (
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Cita: {fmtDate(a.scheduledAt)}
              </p>
            )}
          </div>

          {a.status === 'pending' && (
            <div className="consultas-respond">
              <p className="consultas-respond-title">Confirmar cita</p>
              <label className="block space-y-1.5">
                <span className="text-xs text-text-tertiary">Fecha y hora</span>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="consultas-textarea !min-h-0 py-2"
                />
              </label>
              <label className="mt-3 block space-y-1.5">
                <span className="text-xs text-text-tertiary">Notas (opcional)</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="consultas-textarea"
                  placeholder="Ej: traer la moto 15 min antes"
                />
              </label>
              <button type="button" onClick={handleConfirm} disabled={loading} className="consultas-submit mt-3">
                {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Send className="h-4 w-4" />}
                Confirmar y avisar al cliente
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function CitasPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'pending' | 'confirmed' | 'all'>('pending');

  const { data: pendingTotal = 0 } = useQuery({
    queryKey: ['appointments-count'],
    queryFn: () => api.get<{ count: number }>('/appointments/pending-count').then((r) => r.count),
  });

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments', tab],
    queryFn: () => api.get<Appointment[]>(`/appointments?status=${tab}`),
    refetchInterval: tab === 'pending' ? 90_000 : false,
    refetchIntervalInBackground: false,
  });

  const confirm = useMutation({
    mutationFn: ({ id, scheduledAt, notes }: { id: string; scheduledAt: string; notes?: string }) =>
      api.put(`/appointments/${id}/confirm`, { scheduledAt, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments-count'] });
      toast.success('Cita confirmada — el cliente fue notificado');
    },
    onError: (e) => toast.error('Error', { description: (e as Error).message }),
  });

  const tabs = [
    { id: 'pending' as const, label: 'Pendientes', count: pendingTotal },
    { id: 'confirmed' as const, label: 'Confirmadas' },
    { id: 'all' as const, label: 'Todas' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Citas del portal"
        description="Solicitudes de revisión — confirma fecha y hora al cliente"
      />

      <div className="consultas-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn('consultas-tab', tab === t.id && 'consultas-tab--active')}
          >
            {t.label}
            {t.count != null && t.count > 0 ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="consultas-card h-24 animate-pulse bg-bg-elevated" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="consultas-card py-16 text-center text-sm text-text-tertiary">
          {tab === 'pending' ? 'No hay citas pendientes' : 'Sin citas en esta vista'}
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((a) => (
            <AppointmentCard
              key={a.id}
              a={a}
              onConfirm={(id, scheduledAt, notes) => confirm.mutateAsync({ id, scheduledAt, notes })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
