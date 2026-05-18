import { Router } from 'express';
import { authenticate } from '../../middlewares/authMiddleware';
import { tenantMiddleware } from '../../middlewares/tenantMiddleware';
import * as ctrl from '../../controllers/consultationController';

const router = Router();
router.use(authenticate, tenantMiddleware);

router.get('/', ctrl.listConsultations);
router.get('/pending-count', ctrl.pendingCount);
router.put('/:id/respond', ctrl.respondToConsultation);

export default router;
