import { z } from 'zod';

export const productSchema = z.object({
  sku: z.string().min(1, 'SKU requerido'),
  name: z.string().min(2, 'Nombre requerido'),
  brand: z.string().min(1, 'Marca requerida'),
  category: z.string().min(1, 'Categoría requerida'),
  cost: z.coerce.number().min(0, 'Costo debe ser positivo'),
  price: z.coerce.number().min(0, 'Precio debe ser positivo'),
  stock: z.coerce.number().int().min(0, 'Stock no puede ser negativo'),
  stockMin: z.coerce.number().int().min(0, 'Stock mínimo no puede ser negativo'),
  barcode: z.string().optional(),
  compatibility: z.array(z.string()).default([]),
});

export type ProductInput = z.infer<typeof productSchema>;
