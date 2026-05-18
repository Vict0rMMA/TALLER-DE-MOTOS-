import { MotorcycleRepository } from '../../../domain/repositories/MotorcycleRepository';
import { CustomerRepository } from '../../../domain/repositories/CustomerRepository';
import { DomainError } from '../../../domain/errors/DomainError';

type Input = {
  workshopId: string;
  customerId: string;
  placa: string;
  brand: string;
  model: string;
  cc: number;
  year?: number;
  kmCurrent?: number;
};

export class CreateMotorcycle {
  constructor(
    private readonly motorcycleRepo: MotorcycleRepository,
    private readonly customerRepo: CustomerRepository,
  ) {}

  async execute(input: Input) {
    const customer = await this.customerRepo.findById(input.customerId, input.workshopId);
    if (!customer) throw new DomainError('Cliente no encontrado', 404);

    const existing = await this.motorcycleRepo.findByPlaca(input.placa.toUpperCase(), input.customerId);
    if (existing) throw new DomainError(`Placa '${input.placa}' ya está registrada para este cliente`, 409);

    return this.motorcycleRepo.create({
      customerId: input.customerId,
      placa: input.placa.toUpperCase(),
      brand: input.brand,
      model: input.model,
      cc: input.cc,
      year: input.year,
      kmCurrent: input.kmCurrent ?? 0,
    });
  }
}
