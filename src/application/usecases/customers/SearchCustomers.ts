import { CustomerRepository } from '../../../domain/repositories/CustomerRepository';
import { DomainError } from '../../../domain/errors/DomainError';

export class SearchCustomers {
  constructor(private readonly customerRepo: CustomerRepository) {}

  async execute(workshopId: string, query: string) {
    if (query.trim().length < 2) throw new DomainError('La búsqueda debe tener al menos 2 caracteres', 400);
    return this.customerRepo.search(workshopId, query.trim());
  }
}
