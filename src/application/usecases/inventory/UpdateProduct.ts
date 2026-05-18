import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { DomainError } from '../../../domain/errors/DomainError';
import { toProductResponse } from '../../dtos/ProductDto';
import { Product } from '../../../domain/entities/Product';

type Input = {
  id: string;
  workshopId: string;
  data: Partial<Pick<Product, 'sku' | 'name' | 'brand' | 'category' | 'compatibility' | 'stock' | 'stockMin' | 'cost' | 'price' | 'barcode' | 'active'>>;
};

export class UpdateProduct {
  constructor(private readonly productRepo: ProductRepository) {}

  async execute(input: Input) {
    const existing = await this.productRepo.findById(input.id, input.workshopId);
    if (!existing) throw new DomainError('Producto no encontrado', 404);

    const updated = await this.productRepo.update(input.id, input.workshopId, input.data);
    return toProductResponse(updated);
  }
}
