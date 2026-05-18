import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { toProductResponse } from '../../dtos/ProductDto';

export class GetLowStockProducts {
  constructor(private readonly productRepo: ProductRepository) {}

  async execute(workshopId: string) {
    const products = await this.productRepo.findLowStock(workshopId);
    return products.map(toProductResponse);
  }
}
