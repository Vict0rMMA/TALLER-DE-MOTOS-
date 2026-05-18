import { MotorcycleRepository } from '../../../domain/repositories/MotorcycleRepository';
import { DomainError } from '../../../domain/errors/DomainError';
import { Motorcycle } from '../../../domain/entities/Motorcycle';

type Input = {
  id: string;
  data: Partial<Pick<Motorcycle, 'brand' | 'model' | 'cc' | 'year' | 'kmCurrent'>>;
};

export class UpdateMotorcycle {
  constructor(private readonly motorcycleRepo: MotorcycleRepository) {}

  async execute(input: Input) {
    const existing = await this.motorcycleRepo.findById(input.id);
    if (!existing) throw new DomainError('Moto no encontrada', 404);

    return this.motorcycleRepo.update(input.id, input.data);
  }
}
