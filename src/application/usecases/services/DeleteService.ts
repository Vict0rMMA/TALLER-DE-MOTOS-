import { ServiceRepository } from '../../../domain/repositories/ServiceRepository';
import { DomainError } from '../../../domain/errors/DomainError';

type Input = {
  id: string;
  workshopId: string;
  userId: string;
};

export class DeleteService {
  constructor(private readonly serviceRepo: ServiceRepository) {}

  async execute(input: Input) {
    const existing = await this.serviceRepo.findById(input.id, input.workshopId);
    if (!existing) throw new DomainError('Factura no encontrada', 404);

    await this.serviceRepo.delete(input.id, input.workshopId, input.userId);
  }
}
