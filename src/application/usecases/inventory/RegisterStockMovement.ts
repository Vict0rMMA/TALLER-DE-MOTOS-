import { ProductRepository } from '../../../domain/repositories/ProductRepository';
import { DomainError } from '../../../domain/errors/DomainError';
import { StockMovementType } from '../../../domain/entities/StockMovement';
import prisma from '../../../infrastructure/prisma/client';

type Input = {
  workshopId: string;
  productId: string;
  userId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
};

export class RegisterStockMovement {
  constructor(private readonly productRepo: ProductRepository) {}

  async execute(input: Input) {
    const product = await this.productRepo.findById(input.productId, input.workshopId);
    if (!product) throw new DomainError('Producto no encontrado', 404);

    const isOut = ['sale', 'waste'].includes(input.type);
    if (isOut && product.stock < input.quantity) {
      throw new DomainError(`Stock insuficiente. Disponible: ${product.stock}`, 422);
    }

    const updatedProduct = isOut
      ? await this.productRepo.decrementStock(input.productId, input.quantity)
      : await this.productRepo.incrementStock(input.productId, input.quantity);

    await (prisma as any).stockMovement.create({
      data: {
        productId: input.productId,
        userId: input.userId,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason,
      },
    });

    return updatedProduct;
  }
}
