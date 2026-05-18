'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api-client';
import type { DiagnosisSession } from '@/types/entities';
import type { ApiListResponse } from '@/types/api.types';

export const DIAGNOSIS_KEY = ['diagnosis'] as const;
export const DIAGNOSIS_STATUS_KEY = ['diagnosis', 'status'] as const;

export interface DiagnosisAIStatus {
  configured: boolean;
  provider: 'groq' | 'gemini' | null;
  model: string | null;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export function useDiagnosisAIStatus() {
  return useQuery({
    queryKey: DIAGNOSIS_STATUS_KEY,
    queryFn: () => api.get<DiagnosisAIStatus>('/diagnosis/status'),
    staleTime: 60_000,
  });
}

interface DiagnoseInput {
  question: string;
  motorcycleId?: string;
  history?: ConversationTurn[];
}

export function useDiagnosisSessions() {
  return useQuery({
    queryKey: DIAGNOSIS_KEY,
    queryFn: () => api.get<ApiListResponse<DiagnosisSession>>('/diagnosis?limit=20'),
  });
}

export function useDiagnose() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DiagnoseInput) => api.post<DiagnosisSession>('/diagnosis', data),
    onSuccess: (session) => {
      qc.setQueryData<ApiListResponse<DiagnosisSession>>(DIAGNOSIS_KEY, (prev) => {
        const data = prev?.data ?? [];
        const without = data.filter((s) => s.id !== session.id);
        const total = without.length + 1;
        const base = prev?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 };
        return {
          data: [session, ...without],
          pagination: { ...base, total, totalPages: Math.max(1, Math.ceil(total / base.limit)) },
        };
      });
      qc.invalidateQueries({ queryKey: DIAGNOSIS_KEY });
    },
    meta: {
      getErrorMessage: (err: unknown) =>
        err instanceof ApiError ? err.message : 'No se pudo consultar la IA',
    },
  });
}
