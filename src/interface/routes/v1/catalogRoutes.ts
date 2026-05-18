import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/authMiddleware';
import { tenantMiddleware } from '../../middlewares/tenantMiddleware';
import * as ctrl from '../../controllers/catalogController';

const router = Router();
router.use(authenticate, tenantMiddleware);

router.get('/', ctrl.listCatalog);
router.post('/', requireRole('owner'), ctrl.createCatalogItem);
router.put('/:id', requireRole('owner'), ctrl.updateCatalogItem);
router.delete('/:id', requireRole('owner'), ctrl.deleteCatalogItem);

export default router;
