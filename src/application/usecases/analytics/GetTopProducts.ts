import prisma from '../../../infrastructure/prisma/client';

export class GetTopProducts {
  async execute(workshopId: string, limit = 10) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const movements = await (prisma as any).stockMovement.groupBy({
      by: ['productId'],
      where: {
        type: 'sale',
        createdAt: { gte: thirtyDaysAgo },
        product: { workshopId },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    if (movements.length === 0) return [];

    const productIds = movements.map((m: any) => m.productId);
    const products = await (prisma as any).product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true },
    });

    const productMap = new Map(products.map((p: any) => [p.id, p]));

    return movements.map((m: any) => {
      const product = productMap.get(m.productId) as any;
      const totalSold = m._sum.quantity ?? 0;
      return {
        productId: m.productId,
        productName: product?.name ?? 'Producto eliminado',
        totalSold,
        revenue: totalSold * Number(product?.price ?? 0),
      };
    });
  }
}
