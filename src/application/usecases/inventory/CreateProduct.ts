import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { DomainError } from '../../../domain/errors/DomainError';
import { toProductResponse } from '../../dtos/ProductDto';

type Input = {
  workshopId: string;
  sku: string;
  name: string;
  brand?: string;
  category: string;
  compatibility?: string[];
  stock: number;
  stockMin: number;
  cost: number;
  price: number;
  barcode?: string;
  imageUrl?: string;
  supplier?: string;
  description?: string;
};

export class CreateProduct {
  constructor(private readonly productRepo: ProductRepository) {}

  async execute(input: Input) {
    const existing = await this.productRepo.findBySku(input.sku, input.workshopId);
    if (existing) throw new DomainError(`SKU '${input.sku}' ya existe en este taller`, 409);

    const barcode = input.barcode?.trim() || undefined;
    if (barcode) {
      const dup = await this.productRepo.findByBarcode(barcode, input.workshopId);
      if (dup) throw new DomainError(`El código de barras '${barcode}' ya está registrado en este taller`, 409);
    }

    const product = await this.productRepo.create({
      ...input,
      barcode,
      compatibility: input.compatibility ?? [],
      active: true,
    });

    return toProductResponse(product);
  }
}
