import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { DomainError } from '../../../domain/errors/DomainError';

export class DeleteProduct {
  constructor(private readonly productRepo: ProductRepository) {}

  async execute(id: string, workshopId: string): Promise<void> {
    const existing = await this.productRepo.findById(id, workshopId);
    if (!existing) throw new DomainError('Producto no encontrado', 404);

    await this.productRepo.delete(id, workshopId);
  }
}
