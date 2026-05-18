import { Router } from 'express';
import { authenticate } from '../../middlewares/authMiddleware';
import { listNotifications, sendNotification, sendServiceNotification } from '../../controllers/notificationController';

const router = Router();
router.use(authenticate);

router.get('/', listNotifications);
router.post('/send', sendNotification);
router.post('/service/:serviceId', sendServiceNotification);

export default router;
