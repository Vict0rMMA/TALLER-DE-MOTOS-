import { z } from 'zod';

export const motorcycleSchema = z.object({
  customerId: z.string().min(1, 'Cliente requerido'),
  placa: z
    .string()
    .min(5, 'Placa requerida')
    .max(8, 'Placa inválida')
    .regex(/^[A-Z0-9]+$/i, 'Solo letras y números'),
  brand: z.string().min(1, 'Marca requerida'),
  model: z.string().min(1, 'Modelo requerido'),
  year: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
  cc: z.coerce.number().int().min(50).max(2000).optional(),
  kmCurrent: z.coerce.number().int().min(0, 'Km no puede ser negativo'),
});

export type MotorcycleInput = z.infer<typeof motorcycleSchema>;
