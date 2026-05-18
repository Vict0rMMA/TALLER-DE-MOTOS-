import { ServiceRepository } from '../../../domain/repositories/ServiceRepository';

export class GetServices {
  constructor(private readonly serviceRepo: ServiceRepository) {}

  async execute(workshopId: string, status?: string, page = 1, limit = 20) {
    const [services, total] = await Promise.all([
      this.serviceRepo.findByWorkshop(workshopId, status, page, limit),
      this.serviceRepo.count(workshopId, status),
    ]);
    return { services, total, page, limit };
  }
}
