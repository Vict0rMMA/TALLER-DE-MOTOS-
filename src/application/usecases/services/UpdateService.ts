import { ServiceRepository } from '../../../domain/repositories/ServiceRepository';
import { DomainError } from '../../../domain/errors/DomainError';
import { Service } from '../../../domain/entities/Service';

type Input = {
  id: string;
  workshopId: string;
  data: Partial<Pick<Service, 'type' | 'description' | 'laborCost' | 'kmAtService' | 'nextMaintenanceKm' | 'nextMaintenanceDate' | 'status'>>;
};

export class UpdateService {
  constructor(private readonly serviceRepo: ServiceRepository) {}

  async execute(input: Input) {
    const existing = await this.serviceRepo.findById(input.id, input.workshopId);
    if (!existing) throw new DomainError('Servicio no encontrado', 404);
    if (existing.status === 'closed') throw new DomainError('No se puede editar un servicio cerrado', 422);

    return this.serviceRepo.update(input.id, input.workshopId, input.data);
  }
}
