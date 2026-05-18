import { Request, Response, NextFunction } from 'express';
import { GetDashboardKPIs } from '../../application/usecases/analytics/GetDashboardKPIs';
import { GetTopProducts } from '../../application/usecases/analytics/GetTopProducts';
import prisma from '../../infrastructure/prisma/client';
import {
  buildMotoBrainReportWorkbook,
  reportFilename,
} from '../../infrastructure/excel/buildMotoBrainReport';
import {
  normalizeWorkshopName,
  workshopNameNeedsUpdate,
} from '../../infrastructure/workshop/normalizeWorkshopName';

export const getDashboardKPIs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await new GetDashboardKPIs().execute(req.workshopId!));
  } catch (e) {
    next(e);
  }
};

export const getTopProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit ?? 10);
    res.json(await new GetTopProducts().execute(req.workshopId!, limit));
  } catch (e) {
    next(e);
  }
};

async function fetchRevenueData(workshopId: string, months: number) {
  const results: { month: string; monthLabel: string; revenue: number; serviceCount: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 1);
    const [agg, count] = await Promise.all([
      (prisma as any).service.aggregate({
        where: { workshopId, status: 'closed', closedAt: { gte: start, lt: end } },
        _sum: { totalCost: true },
      }),
      (prisma as any).service.count({
        where: { workshopId, status: 'closed', closedAt: { gte: start, lt: end } },
      }),
    ]);
    const longName = start.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    const monthLabel = longName.charAt(0).toUpperCase() + longName.slice(1);
    const shortLabel = start.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
    results.push({
      month: shortLabel.charAt(0).toUpperCase() + shortLabel.slice(1),
      monthLabel,
      revenue: Number(agg._sum?.totalCost ?? 0),
      serviceCount: count,
    });
  }
  return results;
}

export const getRevenueByMonth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const months = Number(req.query.months ?? 6);
    res.json(await fetchRevenueData(req.workshopId!, months));
  } catch (e) {
    next(e);
  }
};

export const exportRevenueExcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const months = Math.min(24, Math.max(1, Number(req.query.months ?? 6)));
    const workshopId = req.workshopId!;

    const [revenue, topProducts, kpis, workshop] = await Promise.all([
      fetchRevenueData(workshopId, months),
      new GetTopProducts().execute(workshopId, 15),
      new GetDashboardKPIs().execute(workshopId),
      (prisma as any).workshop.findUnique({
        where: { id: workshopId },
        select: { name: true },
      }),
    ]);

    const generatedAt = new Date().toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const periodLabel =
      revenue.length > 0
        ? `${revenue[0].monthLabel} — ${revenue[revenue.length - 1].monthLabel}`
        : 'Sin datos';

    const workshopDisplayName = normalizeWorkshopName(workshop?.name);
    if (workshopNameNeedsUpdate(workshop?.name)) {
      await (prisma as any).workshop.update({
        where: { id: workshopId },
        data: { name: workshopDisplayName },
      });
    }

    const wb = await buildMotoBrainReportWorkbook({
      revenue,
      topProducts,
      kpis: {
        totalCustomers: kpis.totalCustomers,
        closedThisMonth: kpis.closedThisMonth,
        revenueThisMonth: kpis.revenueThisMonth,
        lowStockCount: kpis.lowStockCount,
      },
      meta: {
        workshopName: workshopDisplayName,
        periodLabel,
        generatedAt,
        months,
      },
    });

    const filename = reportFilename();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    next(e);
  }
};
