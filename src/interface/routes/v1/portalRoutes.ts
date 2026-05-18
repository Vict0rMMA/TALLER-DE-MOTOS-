import { Router } from 'express';
import { authenticate, authenticateCustomer } from '../../middlewares/authMiddleware';
import { tenantMiddleware } from '../../middlewares/tenantMiddleware';
import * as ctrl from '../../controllers/portalController';
import * as consultCtrl from '../../controllers/consultationController';
import * as apptCtrl from '../../controllers/appointmentController';
import * as otpCtrl from '../../controllers/portalOtpController';

const router = Router();

router.post('/login', ctrl.portalLogin);
router.post('/auth/otp/request', otpCtrl.requestOtp);
router.post('/auth/otp/verify', otpCtrl.verifyOtp);

router.get('/me', authenticateCustomer, ctrl.portalMe);
router.get('/services', authenticateCustomer, ctrl.portalServices);
router.get('/services/:id', authenticateCustomer, ctrl.portalServiceDetail);
router.post('/consult', authenticateCustomer, consultCtrl.portalConsult);
router.get('/consultations', authenticateCustomer, consultCtrl.portalGetConsultations);
router.post('/motorcycles', authenticateCustomer, ctrl.portalAddMotorcycle);
router.get('/appointments', authenticateCustomer, apptCtrl.portalListAppointments);
router.get('/appointments/next', authenticateCustomer, apptCtrl.portalNextAppointment);
router.post('/appointments', authenticateCustomer, apptCtrl.portalCreateAppointment);
router.post('/schedule-revision', authenticateCustomer, apptCtrl.portalCreateAppointment);

router.put('/enable/:customerId', authenticate, tenantMiddleware, ctrl.enablePortal);
router.delete('/disable/:customerId', authenticate, tenantMiddleware, ctrl.disablePortal);

export default router;
