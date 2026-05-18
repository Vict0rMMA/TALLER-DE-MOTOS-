import { ServiceRepository } from '../../../domain/repositories/ServiceRepository';
import { DomainError } from '../../../domain/errors/DomainError';

export class GetServiceById {
  constructor(private readonly serviceRepo: ServiceRepository) {}

  async execute(id: string, workshopId: string) {
    const service = await this.serviceRepo.findById(id, workshopId);
    if (!service) throw new DomainError('Servicio no encontrado', 404);
    return service;
  }
}
