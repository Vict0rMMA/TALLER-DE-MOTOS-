import { DiagnosisRepository } from '../../../domain/repositories/DiagnosisRepository';
import { MotorcycleRepository } from '../../../domain/repositories/MotorcycleRepository';
import { AIService } from '../../../domain/services/AIService';
import { DomainError } from '../../../domain/errors/DomainError';
import { ConversationTurn } from '../../../infrastructure/ai/prompts';

type Input = {
  question: string;
  motorcycleId?: string;
  workshopId: string;
  history?: ConversationTurn[];
};

export class RunDiagnosis {
  constructor(
    private readonly diagnosisRepo: DiagnosisRepository,
    private readonly motorcycleRepo: MotorcycleRepository,
    private readonly aiService: AIService,
  ) {}

  async execute(input: Input) {
    let motorcycleInfo = 'Motocicleta no especificada';

    if (input.motorcycleId) {
      const moto = await this.motorcycleRepo.findById(input.motorcycleId);
      if (!moto) throw new DomainError('Moto no encontrada', 404);
      motorcycleInfo = `${moto.brand} ${moto.model} ${moto.cc ?? ''}cc (${moto.year ?? 'año desc.'}), ${moto.kmCurrent}km`;
    }

    const symptoms = [input.question];

    const { diagnosis, urgency, confidence, model } = await this.aiService.diagnose(
      symptoms,
      motorcycleInfo,
      input.history ?? [],
    );

    return this.diagnosisRepo.create({
      workshopId: input.workshopId,
      motorcycleId: input.motorcycleId,
      symptoms,
      diagnosis,
      urgency,
      confidence,
      aiModel: model,
    });
  }
}
