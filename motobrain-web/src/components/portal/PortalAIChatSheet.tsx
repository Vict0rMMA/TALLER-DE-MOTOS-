'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Brain,
  Loader2,
  Send,
  Clock,
  CheckCircle2,
  X,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { portalApi } from '@/lib/portal-api-client';
import { usePortalAuthStore } from '@/stores/portal-auth-store';
import { formatCop } from '@/components/portal/portal-shared';
import { cn } from '@/lib/utils';

interface Motorcycle {
  id: string;
  placa: string;
  brand: string;
  model: string;
}

interface ConsultResult {
  id: string;
  aiResponse: string;
  aiMinPrice: number | null;
  aiMaxPrice: number | null;
  routedTo?: 'ai' | 'mechanic';
  status?: string;
}

interface Consultation {
  id: string;
  symptom: string;
  aiResponse?: string;
  mechanicResponse: string | null;
  mechanicPrice?: number | null;
  status?: string;
  createdAt: string;
  respondedAt?: string | null;
}

const QUICK_PROMPTS = [
  '¿Cómo ahorrar gasolina?',
  '¿Cada cuánto cambio el aceite?',
  'Tengo un ruido raro en la moto',
] as const;

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function fmtDay(d: string) {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function isScheduleRequest(symptom: string) {
  return symptom.toLowerCase().includes('agendar revisión');
}

interface PortalAIChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AiBubble({
  text,
  routedTo,
  minPrice,
  maxPrice,
  time,
}: {
  text: string;
  routedTo?: 'ai' | 'mechanic';
  minPrice?: number | null;
  maxPrice?: number | null;
  time?: string;
}) {
  const isMechanic = routedTo === 'mechanic';

  return (
    <div className="flex gap-2.5">
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isMechanic ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400',
        )}
      >
        {isMechanic ? <Wrench className="h-4 w-4" strokeWidth={2} /> : <Brain className="h-4 w-4" strokeWidth={2} />}
      </div>
      <div>
        <div className={cn('portal-ai-bubble-ai', isMechanic && 'portal-ai-bubble-ai--mechanic')}>
          <p className="text-[15px] leading-relaxed text-zinc-100">{text}</p>
          {minPrice != null && maxPrice != null && (
            <div className="portal-ai-price-pill">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                Estimado orientativo
              </p>
              <p className="mt-0.5 text-base font-semibold tabular-nums text-emerald-400">
                {formatCop(minPrice)} – {formatCop(maxPrice)}
              </p>
            </div>
          )}
          {isMechanic && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
              <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              El taller te contactará con el precio exacto.
            </p>
          )}
        </div>
        {time && <p className="portal-ai-bubble-meta">{time}</p>}
      </div>
    </div>
  );
}

function HistoryThread({ c }: { c: Consultation }) {
  const isMechanicPending = c.status === 'pending' && !c.mechanicResponse;
  const routedTo: 'ai' | 'mechanic' | undefined =
    isMechanicPending || isScheduleRequest(c.symptom) ? 'mechanic' : 'ai';

  return (
    <div className="space-y-3">
      <div className="portal-ai-bubble-user">
        <p className="text-[15px] leading-snug">{c.symptom}</p>
        <p className="mt-1.5 text-right text-[11px] font-medium text-emerald-100/70">{fmtTime(c.createdAt)}</p>
      </div>

      {c.aiResponse && !c.mechanicResponse ? (
        <AiBubble text={c.aiResponse} routedTo={routedTo} time={fmtTime(c.createdAt)} />
      ) : null}

      {c.mechanicResponse ? (
        <>
          <AiBubble
            text={c.mechanicResponse}
            routedTo="mechanic"
            time={fmtTime(c.respondedAt ?? c.createdAt)}
          />
          {c.mechanicPrice != null && (
            <p className="pl-10 text-xs text-zinc-500">
              Precio confirmado:{' '}
              <span className="font-semibold text-emerald-400">{formatCop(c.mechanicPrice)}</span>
            </p>
          )}
        </>
      ) : null}

      <div className="pl-10">
        {c.mechanicResponse ? (
          <span className="portal-ai-status portal-ai-status--workshop">
            <CheckCircle2 className="h-3 w-3" />
            Respondida por el taller
          </span>
        ) : isMechanicPending ? (
          <span className="portal-ai-status portal-ai-status--pending">
            <Clock className="h-3 w-3" />
            Pendiente en el taller
          </span>
        ) : (
          <span className="portal-ai-status portal-ai-status--ok">
            <Sparkles className="h-3 w-3" />
            Respuesta de la IA
          </span>
        )}
      </div>
    </div>
  );
}

export function PortalAIChatSheet({ open, onOpenChange }: PortalAIChatSheetProps) {
  const { token } = usePortalAuthStore();
  const [symptom, setSymptom] = useState('');
  const [motoId, setMotoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: me } = useQuery<{ motorcycles: Motorcycle[] }>({
    queryKey: ['portal-me'],
    queryFn: () => portalApi.get('/me'),
    enabled: !!token && open,
  });

  const { data: consultations = [], refetch } = useQuery<Consultation[]>({
    queryKey: ['portal-consultations'],
    queryFn: () => portalApi.get<Consultation[]>('/consultations'),
    enabled: !!token && open,
  });

  const sortedHistory = [...consultations].reverse();
  const showEmpty = consultations.length === 0 && !pendingQuestion;

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
    }
  }, [open, pendingQuestion, consultations.length]);

  async function handleSubmit(e?: React.FormEvent, textOverride?: string) {
    e?.preventDefault();
    const text = (textOverride ?? symptom).trim();
    if (!text || loading) return;

    setLoading(true);
    setPendingQuestion(text);
    setSymptom('');

    try {
      await portalApi.post<ConsultResult>('/consult', {
        symptom: text,
        motorcycleId: motoId || undefined,
      });
      setPendingQuestion(null);
      await refetch();
    } catch (err) {
      setPendingQuestion(null);
      alert(err instanceof Error ? err.message : 'Error al enviar la consulta');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="portal-ai-sheet [&>button]:hidden">
        <div className="portal-ai-handle" aria-hidden />

        <header className="portal-ai-header">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 ring-1 ring-emerald-500/25">
                <Sparkles className="h-5 w-5 text-emerald-400" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-white">Asistente MotoBrain</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                  Consejos al instante · fallas técnicas al taller
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400 transition-colors active:bg-zinc-700"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {me?.motorcycles && me.motorcycles.length > 1 && (
            <select
              value={motoId}
              onChange={(e) => setMotoId(e.target.value)}
              className="portal-input mt-3 text-sm"
            >
              <option value="">Todas mis motos</option>
              {me.motorcycles.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.placa} · {m.brand} {m.model}
                </option>
              ))}
            </select>
          )}
        </header>

        <div className="portal-ai-messages">
          {showEmpty && (
            <div className="portal-ai-empty">
              <div className="portal-ai-empty-icon">
                <Brain className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <p className="mt-4 max-w-[16rem] text-[15px] font-medium text-zinc-200">
                ¿En qué te ayudamos hoy?
              </p>
              <p className="mt-2 max-w-[18rem] text-sm leading-relaxed text-zinc-500">
                Escribe tu duda como si chatearas con el taller. Respuestas rápidas para lo general;
                lo técnico lo revisa un mecánico.
              </p>
            </div>
          )}

          {sortedHistory.map((c, i) => {
            const prev = sortedHistory[i - 1];
            const showDivider = !prev || fmtDay(prev.createdAt) !== fmtDay(c.createdAt);
            return (
              <div key={c.id} className="mb-6">
                {showDivider && <div className="portal-ai-day-divider">{fmtDay(c.createdAt)}</div>}
                <HistoryThread c={c} />
              </div>
            );
          })}

          {pendingQuestion && (
            <div className="mt-4 space-y-3">
              <div className="portal-ai-bubble-user">
                <p className="text-[15px] leading-snug">{pendingQuestion}</p>
              </div>
              <div className="flex items-center gap-2 pl-1 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                Pensando…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-2" />
        </div>

        <div className="portal-ai-composer">
          <div className="portal-ai-chip-row">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                className="portal-ai-chip"
                onClick={() => {
                  setSymptom(q);
                  inputRef.current?.focus();
                }}
              >
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => handleSubmit(e)}
            className="portal-ai-composer-box"
          >
            <textarea
              ref={inputRef}
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Escribe tu pregunta…"
              className="portal-ai-composer-input"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !symptom.trim()}
              className="portal-ai-send"
              aria-label="Enviar"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
