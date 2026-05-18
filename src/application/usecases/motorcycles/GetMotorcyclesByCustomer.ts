import { MotorcycleRepository } from '../../../domain/repositories/MotorcycleRepository';
import { CustomerRepository } from '../../../domain/repositories/CustomerRepository';
import { DomainError } from '../../../domain/errors/DomainError';

export class GetMotorcyclesByCustomer {
  constructor(
    private readonly motorcycleRepo: MotorcycleRepository,
    private readonly customerRepo: CustomerRepository,
  ) {}

  async execute(customerId: string, workshopId: string) {
    const customer = await this.customerRepo.findById(customerId, workshopId);
    if (!customer) throw new DomainError('Cliente no encontrado', 404);

    const motorcycles = await this.motorcycleRepo.findByCustomer(customerId);
    return { customer, motorcycles };
  }
}
