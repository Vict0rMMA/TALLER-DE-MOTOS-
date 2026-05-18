import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { DomainError } from '../../../domain/errors/DomainError';
import { toProductResponse } from '../../dtos/ProductDto';

export class GetProductById {
  constructor(private readonly productRepo: ProductRepository) {}

  async execute(id: string, workshopId: string) {
    const product = await this.productRepo.findById(id, workshopId);
    if (!product) throw new DomainError('Producto no encontrado', 404);
    return toProductResponse(product);
  }
}
