import { DiagnosisResult } from '../entities/DiagnosisSession';
import { ConversationTurn } from '../../infrastructure/ai/prompts';

export type DiagnosisOutput = {
  diagnosis: DiagnosisResult;
  urgency: string;
  confidence: number;
  model: string;
};

export interface AIService {
  diagnose(symptoms: string[], motorcycleInfo: string, history?: ConversationTurn[]): Promise<DiagnosisOutput>;
}
