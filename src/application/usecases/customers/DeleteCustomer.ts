import { CustomerRepository } from '../../../domain/repositories/CustomerRepository';
import { DomainError } from '../../../domain/errors/DomainError';

export class DeleteCustomer {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(id: string, workshopId: string): Promise<void> {
    const existing = await this.customerRepo.findById(id, workshopId);
    if (!existing) throw new DomainError('Cliente no encontrado', 404);

    await this.customerRepo.delete(id, workshopId);
  }
}
