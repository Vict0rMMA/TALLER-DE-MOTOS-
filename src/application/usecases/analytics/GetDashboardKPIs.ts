import prisma from '../../../infrastructure/prisma/client';

export class GetDashboardKPIs {
  async execute(workshopId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCustomers,
      totalProducts,
      lowStockCount,
      openServices,
      closedThisMonth,
      revenueThisMonth,
    ] = await Promise.all([
      (prisma as any).customer.count({ where: { workshopId } }),
      (prisma as any).product.count({ where: { workshopId, active: true } }),
      (prisma as any).product.count({ where: { workshopId, active: true } }).then(async () => {
        const prods = await (prisma as any).product.findMany({ where: { workshopId, active: true }, select: { stock: true, stockMin: true } });
        return prods.filter((p: any) => p.stock <= p.stockMin).length;
      }),
      (prisma as any).service.count({ where: { workshopId, status: 'open' } }),
      (prisma as any).service.count({ where: { workshopId, status: 'closed', closedAt: { gte: startOfMonth } } }),
      (prisma as any).service.aggregate({
        where: { workshopId, status: 'closed', closedAt: { gte: startOfMonth } },
        _sum: { totalCost: true },
      }).then((r: any) => Number(r._sum?.totalCost ?? 0)),
    ]);

    return {
      totalCustomers,
      totalProducts,
      lowStockCount,
      openServices,
      closedThisMonth,
      revenueThisMonth,
      month: startOfMonth.toISOString().slice(0, 7),
    };
  }
}
