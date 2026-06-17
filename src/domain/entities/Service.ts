export const SERVICE_STATUS = ['open', 'closed'] as const;
export type ServiceStatus = (typeof SERVICE_STATUS)[number];

export type Service = {
  id: string;
  workshopId: string;
  motorcycleId: string;
  mechanicId: string;
  type: string;
  description?: string;
  laborCost: number;
  totalCost: number;
  kmAtService: number;
  nextMaintenanceKm?: number;
  nextMaintenanceDate?: Date;
  status: ServiceStatus;
  serviceDate: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Factura
  invoiceNumber?: number;
  paymentMethod?: string;
  paymentReference?: string;
  warranty?: string;
  notes?: string;
  discount?: number;
};
