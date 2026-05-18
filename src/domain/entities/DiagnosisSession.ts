export type DiagnosisResult = {
  possibleCauses: string[];
  recommendedActions: string[];
  estimatedCost?: { min: number; max: number };
  notes?: string;
  reply?: string;
};

export type DiagnosisSession = {
  id: string;
  workshopId: string;
  motorcycleId?: string;
  symptoms: string[];
  diagnosis: DiagnosisResult;
  urgency: string;
  confidence: number;
  aiModel: string;
  createdAt: Date;
};
