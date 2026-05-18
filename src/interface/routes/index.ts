import { Router } from 'express';
import authRoutes from './v1/authRoutes';
import inventoryRoutes from './v1/inventoryRoutes';
import customerRoutes from './v1/customerRoutes';
import motorcycleRoutes from './v1/motorcycleRoutes';
import serviceRoutes from './v1/serviceRoutes';
import diagnosisRoutes from './v1/diagnosisRoutes';
import analyticsRoutes from './v1/analyticsRoutes';
import webhookRoutes from './v1/webhookRoutes';
import whatsappRoutes from './v1/whatsappRoutes';
import portalRoutes from './v1/portalRoutes';
import catalogRoutes from './v1/catalogRoutes';
import consultationRoutes from './v1/consultationRoutes';
import appointmentRoutes from './v1/appointmentRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/customers', customerRoutes);
router.use('/motorcycles', motorcycleRoutes);
router.use('/services', serviceRoutes);
router.use('/diagnosis', diagnosisRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/webhook', webhookRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/portal', portalRoutes);
router.use('/catalog', catalogRoutes);
router.use('/consultations', consultationRoutes);
router.use('/appointments', appointmentRoutes);

export default router;
