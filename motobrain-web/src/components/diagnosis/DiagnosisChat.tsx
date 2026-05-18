'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Send, Bot, User, Loader2, Brain, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { DiagnosisSession } from '@/types/entities';
import { useDiagnose, useDiagnosisAIStatus, type ConversationTurn } from '@/hooks/use-diagnosis';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface DiagnosisChatProps {
  history: DiagnosisSession[];
}

const URGENCY_CONFIG = {
  low: { label: 'Baja', cls: 'text-success bg-success/10', icon: CheckCircle },
  medium: { label: 'Media', cls: 'text-warning bg-warning/10', icon: Info },
  high: { label: 'Alta', cls: 'text-danger bg-danger/10', icon: AlertTriangle },
  critical: { label: 'Crítica', cls: 'text-danger bg-danger/20 font-bold', icon: AlertTriangle },
};

const SUGGESTIONS = [
  'La moto no enciende cuando está fría',
  'Hay vibración excesiva a 60 km/h',
  'El motor consume mucho aceite',
  'Falla de encendido intermitente',
  'Escucho un golpeteo en el motor',
  'El freno delantero se siente esponjoso',
  'La moto pierde potencia en subidas',
  'Sale humo negro por el escape',
];

function buildAssistantSummary(session: DiagnosisSession): string {
  if (session.diagnosis.reply) return session.diagnosis.reply;
  const causes = session.diagnosis.possibleCauses.slice(0, 2).join('; ');
  const actions = session.diagnosis.recommendedActions.slice(0, 2).join('; ');
  return `Diagnóstico (urgencia ${session.urgency}): ${causes}. Acciones: ${actions}.`;
}

function DiagnosisCard({ session }: { session: DiagnosisSession }) {
  const urgency = URGENCY_CONFIG[session.urgency as keyof typeof URGENCY_CONFIG] ?? URGENCY_CONFIG.medium;
  const UrgencyIcon = urgency.icon;
  const d = session.diagnosis;
  const hasStructured = d.possibleCauses.length > 0 || d.recommendedActions.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex gap-3 justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-accent/10 px-4 py-3">
          <p className="text-sm text-text-primary">{session.symptoms[0]}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-elevated">
          <User className="h-4 w-4 text-text-secondary" />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10">
          <Bot className="h-4 w-4 text-accent" />
        </div>
        <div className="max-w-[90%] space-y-3">

          {hasStructured && (
            <div className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', urgency.cls)}>
              <UrgencyIcon className="h-3.5 w-3.5" />
              Urgencia: {urgency.label} · Confianza: {Math.round(session.confidence * 100)}%
            </div>
          )}

          {d.reply && (
            <div className="rounded-2xl rounded-tl-sm bg-bg-elevated px-4 py-3">
              <p className="text-sm text-text-primary leading-relaxed">{d.reply}</p>
            </div>
          )}

          {d.possibleCauses.length > 0 && (
            <div className="rounded-xl rounded-tl-sm bg-bg-elevated p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Posibles causas
              </p>
              <ul className="space-y-1">
                {d.possibleCauses.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {d.recommendedActions.length > 0 && (
            <div className="rounded-xl bg-bg-elevated p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Acciones recomendadas
              </p>
              <ol className="space-y-1">
                {d.recommendedActions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                    <span className="shrink-0 font-mono text-xs text-accent">{i + 1}.</span>
                    {a}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {d.estimatedCost && (
            <p className="text-xs text-text-tertiary">
              Costo estimado: ${d.estimatedCost.min.toLocaleString('es-CO')} — $
              {d.estimatedCost.max.toLocaleString('es-CO')} COP
            </p>
          )}

          {d.notes && <p className="text-xs text-text-tertiary italic">{d.notes}</p>}

        </div>
      </div>
    </div>
  );
}

export function DiagnosisChat({ history }: DiagnosisChatProps) {
  const [question, setQuestion] = useState('');
  const diagnose = useDiagnose();
  const { data: aiStatus } = useDiagnosisAIStatus();
  const bottomRef = useRef<HTMLDivElement>(null);

  const sessions = useMemo(() => {
    if (!diagnose.data) return history;
    if (history.some((s) => s.id === diagnose.data!.id)) return history;
    return [diagnose.data, ...history];
  }, [history, diagnose.data]);

  const buildHistory = useCallback((): ConversationTurn[] => {
    const recent = [...sessions].reverse().slice(-6);
    const turns: ConversationTurn[] = [];
    for (const s of recent) {
      turns.push({ role: 'user', content: s.symptoms[0] });
      turns.push({ role: 'assistant', content: buildAssistantSummary(s) });
    }
    return turns;
  }, [sessions]);

  const errorMessage =
    diagnose.error instanceof ApiError
      ? diagnose.error.message
      : diagnose.error instanceof Error
        ? diagnose.error.message
        : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, diagnose.isPending]);

  function submitQuestion(q: string) {
    const text = q.trim();
    if (!text || diagnose.isPending) return;
    diagnose.mutate({ question: text, history: buildHistory() });
    setQuestion('');
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    submitQuestion(question);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitQuestion(question);
    }
  }

  const isDisabled = diagnose.isPending || aiStatus?.configured === false;

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col gap-4">
      {aiStatus && !aiStatus.configured && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          La IA no está configurada en el servidor. Agrega{' '}
          <code className="font-mono text-xs">GROQ_API_KEY</code> (recomendado) o{' '}
          <code className="font-mono text-xs">GEMINI_API_KEY</code> en el archivo{' '}
          <code className="font-mono text-xs">.env</code> del backend y reinicia{' '}
          <code className="font-mono text-xs">npm run dev</code>.
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {sessions.length === 0 && !diagnose.isPending && (
          <div className="flex flex-col items-center gap-6 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <Brain className="h-8 w-8 text-accent" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-text-primary">Diagnóstico IA</h3>
              <p className="text-sm text-text-secondary max-w-sm">
                Describe el problema de la moto o haz una pregunta técnica. Puedo hacer seguimiento de la conversación.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submitQuestion(s)}
                  disabled={isDisabled}
                  className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-left text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {[...sessions].reverse().map((session) => (
          <DiagnosisCard key={session.id} session={session} />
        ))}

        {diagnose.isPending && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Bot className="h-4 w-4 text-accent" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-bg-elevated px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                Analizando…
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{errorMessage}</div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={sessions.length > 0 ? 'Pregunta de seguimiento o nuevo síntoma…' : 'Describe el problema de la moto…'}
          disabled={isDisabled}
          className="flex-1 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 transition-colors"
        />
        <button
          type="submit"
          disabled={!question.trim() || isDisabled}
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all',
            question.trim() && !isDisabled
              ? 'bg-accent text-bg-primary hover:opacity-90'
              : 'bg-bg-elevated text-text-tertiary cursor-not-allowed',
          )}
        >
          {diagnose.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>
    </div>
  );
}
