import prisma from '../../../infrastructure/prisma/client';

export class GetDashboardKPIs {
  async execute(workshopId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCustomers,
      totalProducts,
      lowStockRows,
      openServices,
      closedThisMonth,
      revenueThisMonth,
      pendingConsultations,
      pendingAppointments,
    ] = await Promise.all([
      (prisma as any).customer.count({ where: { workshopId } }),
      (prisma as any).product.count({ where: { workshopId, active: true } }),
      (prisma as any).$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint AS count
        FROM "Product"
        WHERE "workshopId" = ${workshopId}
          AND active = true
          AND stock <= "stockMin"
      `,
      (prisma as any).service.count({ where: { workshopId, status: 'open' } }),
      (prisma as any).service.count({ where: { workshopId, status: 'closed', closedAt: { gte: startOfMonth } } }),
      (prisma as any).service.aggregate({
        where: { workshopId, status: 'closed', closedAt: { gte: startOfMonth } },
        _sum: { totalCost: true },
      }).then((r: any) => Number(r._sum?.totalCost ?? 0)),
      (prisma as any).clientConsultation.count({ where: { workshopId, status: 'pending' } }),
      (prisma as any).workshopAppointment.count({ where: { workshopId, status: 'pending' } }),
    ]);

    const lowStockCount = Number(lowStockRows[0]?.count ?? 0);

    return {
      totalCustomers,
      totalProducts,
      lowStockCount,
      openServices,
      closedThisMonth,
      revenueThisMonth,
      pendingConsultations,
      pendingAppointments,
      month: startOfMonth.toISOString().slice(0, 7),
    };
  }
}
