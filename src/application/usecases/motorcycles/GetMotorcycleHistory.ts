import { MotorcycleRepository } from '../../../domain/repositories/MotorcycleRepository';
import { ServiceRepository } from '../../../domain/repositories/ServiceRepository';
import { DomainError } from '../../../domain/errors/DomainError';

export class GetMotorcycleHistory {
  constructor(
    private readonly motorcycleRepo: MotorcycleRepository,
    private readonly serviceRepo: ServiceRepository,
  ) {}

  async execute(motorcycleId: string) {
    const motorcycle = await this.motorcycleRepo.findById(motorcycleId);
    if (!motorcycle) throw new DomainError('Moto no encontrada', 404);

    const services = await this.serviceRepo.findByMotorcycle(motorcycleId);
    return { motorcycle, services };
  }
}
