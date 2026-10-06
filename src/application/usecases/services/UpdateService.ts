import { ServiceRepository } from '../../../domain/repositories/ServiceRepository';
import { DomainError } from '../../../domain/errors/DomainError';
import { Service } from '../../../domain/entities/Service';

type Input = {
  id: string;
  workshopId: string;
  data: Partial<Pick<Service,
    | 'type' | 'description' | 'laborCost' | 'kmAtService' | 'nextMaintenanceKm'
    | 'nextMaintenanceDate' | 'status' | 'mechanicId'
    | 'paymentMethod' | 'paymentReference' | 'warranty' | 'notes' | 'discount'
  >>;
};

// Una vez cerrada (facturada), solo se corrigen estos campos — no se puede
// reabrir el servicio ni tocar lo que ya se le entregó al cliente (tipo,
// kilometraje, próximo mantenimiento) por esta vía.
const CLOSED_EDITABLE_FIELDS = [
  'mechanicId', 'paymentMethod', 'paymentReference', 'warranty', 'notes', 'discount', 'laborCost',
] as const;

export class UpdateService {
  constructor(private readonly serviceRepo: ServiceRepository) {}

  async execute(input: Input) {
    const existing = await this.serviceRepo.findById(input.id, input.workshopId);
    if (!existing) throw new DomainError('Servicio no encontrado', 404);

    if (existing.status === 'closed') {
      const keys = Object.keys(input.data) as (keyof Input['data'])[];
      const disallowed = keys.filter((k) => !(CLOSED_EDITABLE_FIELDS as readonly string[]).includes(k));
      if (disallowed.length > 0) {
        throw new DomainError(
          'En una factura ya cerrada solo se puede corregir: mecánico, forma de pago, garantía, notas, descuento y mano de obra.',
          422,
        );
      }

      const data: Record<string, unknown> = { ...input.data };
      if (data.laborCost !== undefined || data.discount !== undefined) {
        const productsTotal = existing.products.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
        const laborCost = (data.laborCost as number | undefined) ?? existing.laborCost;
        const discount = (data.discount as number | undefined) ?? existing.discount ?? 0;
        data.totalCost = laborCost + productsTotal - discount;
      }
      return this.serviceRepo.update(input.id, input.workshopId, data);
    }

    return this.serviceRepo.update(input.id, input.workshopId, input.data);
  }
}
