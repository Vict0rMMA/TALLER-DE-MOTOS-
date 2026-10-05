import { DiagnosisRepository } from '../../../domain/repositories/DiagnosisRepository';
import { MotorcycleRepository } from '../../../domain/repositories/MotorcycleRepository';
import { DomainError } from '../../../domain/errors/DomainError';

export class GetDiagnosisHistory {
  constructor(
    private readonly diagnosisRepo: DiagnosisRepository,
    private readonly motorcycleRepo: MotorcycleRepository,
  ) {}

  async execute(motorcycleId: string, workshopId: string) {
    const moto = await this.motorcycleRepo.findById(motorcycleId, workshopId);
    if (!moto) throw new DomainError('Moto no encontrada', 404);

    return this.diagnosisRepo.findByMotorcycle(motorcycleId);
  }
}
