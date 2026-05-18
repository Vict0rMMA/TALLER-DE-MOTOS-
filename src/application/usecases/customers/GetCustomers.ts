import { CustomerRepository } from '../../../domain/repositories/CustomerRepository';

export class GetCustomers {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(workshopId: string, page = 1, limit = 50) {
    const [customers, total] = await Promise.all([
      this.customerRepo.findByWorkshop(workshopId, page, limit),
      this.customerRepo.count(workshopId),
    ]);
    return { customers, total, page, limit };
  }
}
