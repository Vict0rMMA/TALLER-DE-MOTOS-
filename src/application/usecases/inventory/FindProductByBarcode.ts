import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { DomainError } from '../../../domain/errors/DomainError';
import { toProductResponse } from '../../dtos/ProductDto';

export class FindProductByBarcode {
  constructor(private readonly productRepo: ProductRepository) {}

  async execute(barcode: string, workshopId: string) {
    const product = await this.productRepo.findByBarcode(barcode, workshopId);
    if (!product) throw new DomainError('Producto no encontrado', 404);
    return toProductResponse(product);
  }
}
