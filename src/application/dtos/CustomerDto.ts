import { Customer } from '../../domain/entities/Customer';
import { Motorcycle } from '../../domain/entities/Motorcycle';

export type CustomerWithMotorcycles = Customer & { motorcycles?: Motorcycle[] };

export const toCustomerResponse = (c: CustomerWithMotorcycles) => ({
  id: c.id,
  workshopId: c.workshopId,
  name: c.name,
  cedula: c.cedula,
  phone: c.phone,
  email: c.email,
  optInWhatsapp: c.optInWhatsapp,
  createdAt: c.createdAt,
  motorcycles: c.motorcycles,
});
