import { Service } from '../../domain/entities/Service';

export type ServiceResponse = Service & {
  products?: Array<{ productId: string; quantity: number; unitPrice: number }>;
};

export const toServiceResponse = (s: ServiceResponse) => ({
  id: s.id,
  workshopId: s.workshopId,
  motorcycleId: s.motorcycleId,
  mechanicId: s.mechanicId,
  type: s.type,
  description: s.description,
  laborCost: s.laborCost,
  totalCost: s.totalCost,
  kmAtService: s.kmAtService,
  nextMaintenanceKm: s.nextMaintenanceKm,
  nextMaintenanceDate: s.nextMaintenanceDate,
  status: s.status,
  serviceDate: s.serviceDate,
  closedAt: s.closedAt,
  products: s.products ?? [],
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});
