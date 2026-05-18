'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Send,
  Brain,
  User,
  Calendar,
  Phone,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface Consultation {
  id: string;
  symptom: string;
  aiResponse: string;
  aiMinPrice: number | null;
  aiMaxPrice: number | null;
  mechanicResponse: string | null;
  mechanicPrice: number | null;
  status: 'pending' | 'answered';
  createdAt: string;
  respondedAt: string | null;
  customer: { id: string; name: string; phone: string };
  motorcycle: { placa: string; brand: string; model: string } | null;
  mechanic: { name: string } | null;
}

type ConsultKind = 'schedule' | 'technical' | 'general';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function fmtWhen(d: string) {
  return new Date(d).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function consultKind(symptom: string): ConsultKind {
  const s = symptom.toLowerCase();
  if (s.includes('agendar revisión') || s.includes('agendar revision')) return 'schedule';
  if (
    s.includes('ruido') ||
    s.includes('falla') ||
    s.includes('no arranca') ||
    s.includes('fuga') ||
    s.includes('revisión') ||
    s.includes('revision')
  ) {
    return 'technical';
  }
  return 'general';
}

function kindLabel(kind: ConsultKind) {
  if (kind === 'schedule') return 'Cita';
  if (kind === 'technical') return 'Técnica';
  return 'Consulta';
}

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits.startsWith('57') ? digits : `57${digits}`}`;
}

function ConsultationCard({
  c,
  onRespond,
}: {
  c: Consultation;
  onRespond: (id: string, response: string, price?: number) => void;
}) {
  const [expanded, setExpanded] = useState(c.status === 'pending');
  const [response, setResponse] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const kind = consultKind(c.symptom);
  const isPending = c.status === 'pending';

  const respondPlaceholder =
    kind === 'schedule'
      ? 'Confirma al cliente el día, la hora y qué incluye la revisión…'
      : kind === 'technical'
        ? 'Diagnóstico, trabajo a realizar y precio confirmado…'
        : 'Confirma o complementa lo que la IA indicó…';

  async function handleRespond() {
    if (!response.trim()) return;
    setSubmitting(true);
    try {
      await onRespond(c.id, response.trim(), price ? Number(price) : undefined);
      setResponse('');
      setPrice('');
      setExpanded(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article
      className={cn('consultas-card', isPending && 'consultas-card--pending')}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="consultas-card-header"
      >
        <div
          className={cn(
            'consultas-avatar',
            isPending ? 'consultas-avatar--pending' : 'consultas-avatar--done',
          )}
        >
          {initials(c.customer.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-text-primary">
              {c.customer.name}
            </p>
            <span
              className={cn(
                'consultas-badge',
                isPending ? 'consultas-badge--pending' : 'consultas-badge--done',
              )}
            >
              {isPending ? (
                <>
                  <Clock className="h-3 w-3" />
                  Pendiente
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Respondida
                </>
              )}
            </span>
            <span
              className={cn(
                'consultas-badge',
                kind === 'schedule'
                  ? 'consultas-badge--schedule'
                  : 'consultas-badge--pending',
              )}
            >
              {kind === 'schedule' ? (
                <Calendar className="h-3 w-3" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {kindLabel(kind)}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-text-tertiary">
            {c.motorcycle
              ? `${c.motorcycle.placa} · ${c.motorcycle.brand} ${c.motorcycle.model}`
              : 'Sin moto'}{' '}
            · {fmtWhen(c.createdAt)}
          </p>
          {!expanded && (
            <p className="mt-2 line-clamp-1 text-sm text-text-secondary">{c.symptom}</p>
          )}
        </div>

        {expanded ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-text-tertiary" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-text-tertiary" />
        )}
      </button>

      {expanded && (
        <div className="consultas-body">
          <div className="consultas-thread">
            <div className="consultas-msg consultas-msg--client">
              <div className="consultas-msg-label text-text-tertiary">
                <User className="h-3.5 w-3.5" />
                Cliente
              </div>
              <p className="consultas-msg-text">{c.symptom}</p>
            </div>

            <div className="consultas-msg consultas-msg--ai">
              <div className="consultas-msg-label text-accent">
                <Brain className="h-3.5 w-3.5" />
                IA (portal)
              </div>
              <p className="consultas-msg-text">{c.aiResponse}</p>
              {c.aiMinPrice != null && c.aiMaxPrice != null && (
                <p className="consultas-price-hint">
                  Rango orientativo:{' '}
                  <span className="font-semibold text-accent">
                    ${c.aiMinPrice.toLocaleString('es-CO')} – $
                    {c.aiMaxPrice.toLocaleString('es-CO')} COP
                  </span>
                </p>
              )}
            </div>

            {c.mechanicResponse && (
              <div className="consultas-msg consultas-msg--mechanic">
                <div className="consultas-msg-label text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Taller{c.mechanic ? ` · ${c.mechanic.name}` : ''}
                </div>
                <p className="consultas-msg-text">{c.mechanicResponse}</p>
                {c.mechanicPrice != null && (
                  <p className="consultas-price-hint">
                    Precio confirmado:{' '}
                    <span className="font-semibold text-success">
                      ${c.mechanicPrice.toLocaleString('es-CO')} COP
                    </span>
                  </p>
                )}
              </div>
            )}

            <a
              href={whatsappHref(c.customer.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
            >
              <Phone className="h-3.5 w-3.5" />
              WhatsApp · {c.customer.phone}
            </a>
          </div>

          {isPending && (
            <div className="consultas-respond">
              <p className="consultas-respond-title">Tu respuesta al cliente</p>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={4}
                placeholder={respondPlaceholder}
                className="consultas-textarea"
              />
              <div className="consultas-form-row">
                <div className="consultas-price-input">
                  <span className="text-sm text-text-tertiary">$</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Precio exacto (opcional)"
                  />
                  <span className="shrink-0 text-xs text-text-tertiary">COP</span>
                </div>
                <button
                  type="button"
                  onClick={handleRespond}
                  disabled={submitting || !response.trim()}
                  className="consultas-submit"
                >
                  {submitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Enviar respuesta
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function ConsultasPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'pending' | 'answered' | 'all'>('pending');

  const { data: pendingTotal = 0 } = useQuery({
    queryKey: ['consultations-count'],
    queryFn: () =>
      api.get<{ count: number }>('/consultations/pending-count').then((r) => r.count),
  });

  const { data: consultations = [], isLoading } = useQuery<Consultation[]>({
    queryKey: ['consultations', tab],
    queryFn: () => api.get<Consultation[]>(`/consultations?status=${tab}`),
    refetchInterval: tab === 'pending' ? 90_000 : false,
    refetchIntervalInBackground: false,
  });

  const respond = useMutation({
    mutationFn: ({
      id,
      mechanicResponse,
      mechanicPrice,
    }: {
      id: string;
      mechanicResponse: string;
      mechanicPrice?: number;
    }) => api.put(`/consultations/${id}/respond`, { mechanicResponse, mechanicPrice }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations'] });
      qc.invalidateQueries({ queryKey: ['consultations-count'] });
      toast.success('Respuesta enviada al cliente');
    },
    onError: (e) => toast.error('Error', { description: (e as Error).message }),
  });

  const answeredOnPage = consultations.filter((c) => c.status === 'answered').length;

  const tabs = [
    { id: 'pending' as const, label: 'Pendientes', count: pendingTotal },
    { id: 'answered' as const, label: 'Respondidas', count: null },
    { id: 'all' as const, label: 'Todas', count: null },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultas de clientes"
        description="Mensajes del portal: revisa, confirma precios y responde al cliente"
      />

      <div className="consultas-stats">
        <div className="consultas-stat">
          <p className="consultas-stat-value text-warning">{pendingTotal}</p>
          <p className="consultas-stat-label">Pendientes de taller</p>
        </div>
        <div className="consultas-stat">
          <p className="consultas-stat-value">{consultations.length}</p>
          <p className="consultas-stat-label">
            {tab === 'pending' ? 'En esta lista' : tab === 'answered' ? 'Respondidas' : 'Total filtro'}
          </p>
        </div>
        <div className="consultas-stat col-span-2 sm:col-span-1">
          <p className="consultas-stat-value text-accent">
            {tab === 'answered' ? answeredOnPage : '—'}
          </p>
          <p className="consultas-stat-label">Vista actual</p>
        </div>
      </div>

      <div className="consultas-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
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
          {[1, 2, 3].map((i) => (
            <div key={i} className="consultas-card h-24 animate-pulse bg-bg-elevated" />
          ))}
        </div>
      ) : consultations.length === 0 ? (
        <div className="consultas-card flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-elevated">
            <MessageSquare className="h-7 w-7 text-text-tertiary/50" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-base font-semibold text-text-primary">
              {tab === 'pending' ? 'Sin consultas pendientes' : 'Nada por aquí'}
            </p>
            <p className="mt-1 max-w-sm text-sm text-text-tertiary">
              {tab === 'pending'
                ? 'Cuando un cliente escriba desde el portal, aparecerá aquí para que confirmes.'
                : 'Las consultas del portal se listan en Pendientes o Todas.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((c) => (
            <ConsultationCard
              key={c.id}
              c={c}
              onRespond={(id, response, price) =>
                respond.mutateAsync({ id, mechanicResponse: response, mechanicPrice: price })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
