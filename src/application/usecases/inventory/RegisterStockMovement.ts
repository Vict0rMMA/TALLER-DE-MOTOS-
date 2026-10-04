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

    const delta = isOut ? -input.quantity : input.quantity;

    const result = await (prisma as any).$transaction(async (tx: any) => {
      // Guard en el UPDATE para que dos movimientos simultaneos no dejen el
      // stock en negativo (la validacion de arriba por si sola no alcanza).
      const updateResult = await tx.product.updateMany({
        where: {
          id: input.productId,
          workshopId: input.workshopId,
          ...(isOut ? { stock: { gte: input.quantity } } : {}),
        },
        data: { stock: { increment: delta } },
      });
      if (updateResult.count !== 1) {
        throw new DomainError('Stock insuficiente', 422);
      }

      const updated = await tx.product.findFirst({ where: { id: input.productId, workshopId: input.workshopId } });

      await tx.stockMovement.create({
        data: {
          productId: input.productId,
          userId: input.userId,
          type: input.type,
          quantity: input.quantity,
          reason: input.reason,
        },
      });

      return updated;
    });

    return {
      id: result.id,
      workshopId: result.workshopId,
      sku: result.sku,
      name: result.name,
      brand: result.brand ?? undefined,
      category: result.category,
      compatibility: result.compatibility ?? [],
      stock: result.stock,
      stockMin: result.stockMin,
      cost: Number(result.cost),
      price: Number(result.price),
      barcode: result.barcode ?? undefined,
      imageUrl: result.imageUrl ?? undefined,
      supplier: result.supplier ?? undefined,
      description: result.description ?? undefined,
      active: result.active,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }
}
