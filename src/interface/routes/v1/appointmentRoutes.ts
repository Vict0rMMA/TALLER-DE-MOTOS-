import { Router } from 'express';
import { authenticate } from '../../middlewares/authMiddleware';
import { tenantMiddleware } from '../../middlewares/tenantMiddleware';
import * as ctrl from '../../controllers/appointmentController';

const router = Router();

router.get('/', authenticate, tenantMiddleware, ctrl.listAppointments);
router.get('/pending-count', authenticate, tenantMiddleware, ctrl.pendingAppointmentsCount);
router.put('/:id/confirm', authenticate, tenantMiddleware, ctrl.confirmAppointment);

export default router;
