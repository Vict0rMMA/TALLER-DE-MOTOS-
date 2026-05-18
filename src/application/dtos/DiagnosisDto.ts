import { DiagnosisSession } from '../../domain/entities/DiagnosisSession';

export const toDiagnosisResponse = (d: DiagnosisSession) => ({
  id: d.id,
  motorcycleId: d.motorcycleId,
  symptoms: d.symptoms,
  diagnosis: d.diagnosis,
  urgency: d.urgency,
  confidence: d.confidence,
  aiModel: d.aiModel,
  createdAt: d.createdAt,
});
