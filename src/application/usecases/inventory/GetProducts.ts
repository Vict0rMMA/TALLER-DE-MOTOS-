import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { toProductResponse } from '../../dtos/ProductDto';

export class GetProducts {
  constructor(private readonly productRepo: ProductRepository) {}

  async execute(workshopId: string, category?: string) {
    const products = await this.productRepo.findByWorkshop(workshopId, category);
    return products.map(toProductResponse);
  }
}
