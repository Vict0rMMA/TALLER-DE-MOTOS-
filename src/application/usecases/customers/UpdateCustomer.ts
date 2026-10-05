import { CustomerRepository } from '../../../domain/repositories/CustomerRepository';
import { DomainError } from '../../../domain/errors/DomainError';
import { Customer } from '../../../domain/entities/Customer';

type Input = {
  id: string;
  workshopId: string;
  data: Partial<Pick<Customer, 'name' | 'cedula' | 'phone' | 'email' | 'optInWhatsapp' | 'optInEmail'>>;
};

export class UpdateCustomer {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(input: Input) {
    const existing = await this.customerRepo.findById(input.id, input.workshopId);
    if (!existing) throw new DomainError('Cliente no encontrado', 404);

    // Con cedula, el cliente ya puede entrar al portal: se activa solo, sin
    // que el taller tenga que acordarse de apretar "Activar portal" aparte.
    const cedula = input.data.cedula ?? existing.cedula;
    const data: Partial<Omit<Customer, 'id' | 'workshopId' | 'createdAt'>> = { ...input.data };
    if (cedula?.trim() && !existing.portalActive) {
      data.portalActive = true;
    }

    return this.customerRepo.update(input.id, input.workshopId, data);
  }
}
