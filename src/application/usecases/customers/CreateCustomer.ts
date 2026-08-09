import { CustomerRepository } from '../../../domain/repositories/CustomerRepository';
import { DomainError } from '../../../domain/errors/DomainError';

type Input = {
  workshopId: string;
  name: string;
  cedula?: string;
  phone: string;
  email?: string;
  optInWhatsapp?: boolean;
};

export class CreateCustomer {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(input: Input) {
    if (input.cedula) {
      const byCedula = await this.customerRepo.findByCedula(input.cedula, input.workshopId);
      if (byCedula) throw new DomainError('Ya existe un cliente con esa cédula', 409);
    }

    return this.customerRepo.create({
      ...input,
      optInWhatsapp: input.optInWhatsapp ?? true,
      // La cédula es la contraseña del portal: sin ella el login lo rechazaría.
      portalActive: !!input.cedula?.trim(),
    });
  }
}
