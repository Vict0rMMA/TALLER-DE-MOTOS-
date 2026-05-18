'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { DiagnosisChat } from '@/components/diagnosis/DiagnosisChat';
import { useDiagnosisSessions } from '@/hooks/use-diagnosis';

export default function DiagnosticoPage() {
  const { data } = useDiagnosisSessions();
  const sessions = data?.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Diagnóstico IA"
        description="Asistente para diagnóstico de motos — respuestas enfocadas en tu consulta"
      />
      <DiagnosisChat history={sessions} />
    </div>
  );
}
