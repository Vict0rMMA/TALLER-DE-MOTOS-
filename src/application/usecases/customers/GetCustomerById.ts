import { CustomerRepository } from '../../../domain/repositories/CustomerRepository';
import { DomainError } from '../../../domain/errors/DomainError';

export class GetCustomerById {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(id: string, workshopId: string) {
    const customer = await this.customerRepo.findById(id, workshopId);
    if (!customer) throw new DomainError('Cliente no encontrado', 404);
    return customer;
  }
}
