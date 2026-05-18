import { ServiceRepository } from '../../../domain/repositories/ServiceRepository';

export class GetUpcomingMaintenance {
  constructor(private readonly serviceRepo: ServiceRepository) {}

  async execute(workshopId: string, days = 30) {
    return this.serviceRepo.findUpcomingMaintenance(workshopId, days);
  }
}
