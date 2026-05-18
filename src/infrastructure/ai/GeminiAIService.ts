import { env } from '../config/env';
import { AIService, DiagnosisOutput } from '../../domain/services/AIService';
import { DomainError } from '../../domain/errors/DomainError';
import { buildDiagnosisPrompt, ConversationTurn } from './prompts';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export class GeminiAIService implements AIService {
  async diagnose(symptoms: string[], motorcycleInfo: string, history: ConversationTurn[] = []): Promise<DiagnosisOutput> {
    if (!env.GEMINI_API_KEY) throw new DomainError('GEMINI_API_KEY no configurado', 503);

    const { systemPrompt, messages } = buildDiagnosisPrompt(symptoms, motorcycleInfo, history);

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(`${GEMINI_API_URL}?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });

    if (!response.ok) throw new DomainError('Error al contactar Gemini API', 503);

    const data = await response.json() as any;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
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
        confidence: parsed.confidence ?? 0.6,
        model: 'gemini-1.5-flash',
      };
    } catch {
      throw new DomainError('La IA devolvió un formato inválido', 502);
    }
  }
}
