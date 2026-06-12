import prisma from '../prisma/client';

export async function runDemandPrediction(workshopId: string): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const movements = await (prisma as any).stockMovement.findMany({
    where: {
      type: 'sale',
      createdAt: { gte: thirtyDaysAgo },
      product: { workshopId },
    },
    include: { product: { select: { id: true, name: true, stock: true, stockMin: true } } },
  });

  const demandMap = new Map<string, { name: string; totalSold: number; stock: number; stockMin: number }>();
  for (const m of movements) {
    const entry = demandMap.get(m.productId) ?? { name: m.product.name, totalSold: 0, stock: m.product.stock, stockMin: m.product.stockMin };
    entry.totalSold += m.quantity;
    demandMap.set(m.productId, entry);
  }

}
