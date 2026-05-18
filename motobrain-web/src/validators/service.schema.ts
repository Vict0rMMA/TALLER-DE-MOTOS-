import { z } from 'zod';

export const serviceSchema = z.object({
  motorcycleId: z.string().min(1, 'Motocicleta requerida'),
  customerId: z.string().min(1, 'Cliente requerido'),
  type: z.string().min(1, 'Tipo de servicio requerido'),
  description: z.string().optional(),
  mechanicId: z.string().optional(),
  laborCost: z.coerce.number().min(0).default(0),
  products: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.coerce.number().int().min(1),
        unitPrice: z.coerce.number().min(0),
      }),
    )
    .default([]),
});

export const serviceStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'closed', 'cancelled']),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
export type ServiceStatusInput = z.infer<typeof serviceStatusSchema>;
