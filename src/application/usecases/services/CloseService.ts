import { ServiceRepository } from '../../../domain/repositories/ServiceRepository';
import { DomainError } from '../../../domain/errors/DomainError';

type Input = {
  id: string;
  workshopId: string;
  laborCost?: number;
  paymentMethod?: string;
  paymentReference?: string;
  warranty?: string;
  notes?: string;
  discount?: number;
};

export class CloseService {
  constructor(private readonly serviceRepo: ServiceRepository) {}

  async execute(input: Input) {
    const service = await this.serviceRepo.findById(input.id, input.workshopId);
    if (!service) throw new DomainError('Servicio no encontrado', 404);
    if (service.status === 'closed') throw new DomainError('El servicio ya está cerrado', 422);

    // Persistir datos de factura provistos al cerrar (todo opcional).
    const data: Record<string, unknown> = {};
    if (input.laborCost !== undefined) {
      const productsTotal = service.products.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
      data.laborCost = input.laborCost;
      data.totalCost = input.laborCost + productsTotal;
    }
    if (input.paymentMethod !== undefined) data.paymentMethod = input.paymentMethod;
    if (input.paymentReference !== undefined) data.paymentReference = input.paymentReference;
    if (input.warranty !== undefined) data.warranty = input.warranty;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.discount !== undefined) data.discount = input.discount;

    if (Object.keys(data).length > 0) {
      await this.serviceRepo.update(input.id, input.workshopId, data);
    }

    // close() asigna el invoiceNumber consecutivo de forma atómica.
    return this.serviceRepo.close(input.id, input.workshopId, new Date());
  }
}
