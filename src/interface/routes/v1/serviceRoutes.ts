import { Router } from 'express';
import * as ctrl from '../../controllers/serviceController';
import * as photoCtrl from '../../controllers/servicePhotoController';
import * as receiptCtrl from '../../controllers/receiptController';
import { validateDto } from '../../middlewares/validateDto';
import { authenticate } from '../../middlewares/authMiddleware';
import { tenantMiddleware } from '../../middlewares/tenantMiddleware';
import { CreateServiceDto } from '../../../infrastructure/validators/services/CreateServiceDto';
import { UpdateServiceDto } from '../../../infrastructure/validators/services/UpdateServiceDto';
import { CloseServiceDto } from '../../../infrastructure/validators/services/CloseServiceDto';

const router = Router();

router.get('/:id/receipt', receiptCtrl.getReceipt);

router.use(authenticate, tenantMiddleware);

router.get('/', ctrl.listServices);
router.get('/upcoming-maintenance', ctrl.getUpcomingMaintenance);
router.get('/:id', ctrl.getService);
router.post('/', validateDto(CreateServiceDto), ctrl.createService);
router.put('/:id', validateDto(UpdateServiceDto), ctrl.updateService);
router.post('/:id/close', validateDto(CloseServiceDto), ctrl.closeService);
router.post('/:id/photos', photoCtrl.uploadMiddleware, photoCtrl.addPhoto);
router.delete('/:id/photos', photoCtrl.removePhoto);

export default router;
