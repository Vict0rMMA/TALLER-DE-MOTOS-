import { Router } from 'express';
import * as ctrl from '../../controllers/analyticsController';
import { authenticate, requireRole } from '../../middlewares/authMiddleware';
import { tenantMiddleware } from '../../middlewares/tenantMiddleware';

const router = Router();
router.use(authenticate, tenantMiddleware);

router.get('/kpis', ctrl.getDashboardKPIs);

router.get('/top-products', requireRole('owner'), ctrl.getTopProducts);
router.get('/revenue', requireRole('owner'), ctrl.getRevenueByMonth);
router.get('/revenue/export', requireRole('owner'), ctrl.exportRevenueExcel);

export default router;
