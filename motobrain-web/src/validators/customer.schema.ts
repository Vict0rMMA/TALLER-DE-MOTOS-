import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  cedula: z.string().min(5, 'Cédula requerida'),
  phone: z.string().min(7, 'Teléfono requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  optInWhatsapp: z.boolean().default(false),
});

export type CustomerInput = z.infer<typeof customerSchema>;
