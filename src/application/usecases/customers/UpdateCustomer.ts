import { CustomerRepository } from '../../../domain/repositories/CustomerRepository';
import { DomainError } from '../../../domain/errors/DomainError';
import { Customer } from '../../../domain/entities/Customer';

type Input = {
  id: string;
  workshopId: string;
  data: Partial<Pick<Customer, 'name' | 'cedula' | 'phone' | 'email' | 'optInWhatsapp'>>;
};

export class UpdateCustomer {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(input: Input) {
    const existing = await this.customerRepo.findById(input.id, input.workshopId);
    if (!existing) throw new DomainError('Cliente no encontrado', 404);

    return this.customerRepo.update(input.id, input.workshopId, input.data);
  }
}
