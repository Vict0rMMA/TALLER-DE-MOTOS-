import { env } from '../config/env';
import { AIService, DiagnosisOutput } from '../../domain/services/AIService';
import { DomainError } from '../../domain/errors/DomainError';
import { buildDiagnosisPrompt, ConversationTurn } from './prompts';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export class GroqAIService implements AIService {
  async diagnose(symptoms: string[], motorcycleInfo: string, history: ConversationTurn[] = []): Promise<DiagnosisOutput> {
    if (!env.GROQ_API_KEY) throw new DomainError('GROQ_API_KEY no configurado', 503);

    const { systemPrompt, messages } = buildDiagnosisPrompt(symptoms, motorcycleInfo, history);

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errBody = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      const detail = errBody.error?.message ?? response.statusText;
      throw new DomainError(`Groq API: ${detail}`, response.status >= 500 ? 503 : 502);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content ?? '';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('no json');
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        diagnosis: {
          possibleCauses: parsed.possibleCauses ?? [],
          recommendedActions: parsed.recommendedActions ?? [],
          estimatedCost: parsed.estimatedCost,
          notes: parsed.notes,
          reply: parsed.reply,
        },
        urgency: parsed.urgency ?? 'medium',
        confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.7)),
        model: 'groq-llama3.3',
      };
    } catch {
      throw new DomainError('La IA no pudo procesar la consulta. Intenta reformular la pregunta.', 502);
    }
  }
}
