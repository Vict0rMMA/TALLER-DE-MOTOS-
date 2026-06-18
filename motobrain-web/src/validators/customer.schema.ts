import { z } from 'zod';
import { isValidColombiaMobileE164 } from '@/lib/phone';

export const customerSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  cedula: z.string().min(5, 'Cédula requerida'),
  phone: z
    .string()
    .min(1, 'Teléfono requerido')
    .refine(isValidColombiaMobileE164, {
      message: 'Ingresa un celular colombiano de 10 dígitos (ej. 300 123 4567)',
    }),
  email: z.string().min(1, 'Email requerido').email('Email inválido'),
  optInWhatsapp: z.boolean().default(false),
});

export type CustomerInput = z.infer<typeof customerSchema>;
