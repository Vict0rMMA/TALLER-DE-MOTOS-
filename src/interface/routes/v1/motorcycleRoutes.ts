import { Router } from 'express';
import * as ctrl from '../../controllers/motorcycleController';
import { validateDto } from '../../middlewares/validateDto';
import { authenticate } from '../../middlewares/authMiddleware';
import { tenantMiddleware } from '../../middlewares/tenantMiddleware';
import { CreateMotorcycleDto } from '../../../infrastructure/validators/motorcycles/CreateMotorcycleDto';
import { UpdateMotorcycleDto } from '../../../infrastructure/validators/motorcycles/UpdateMotorcycleDto';

const router = Router();
router.use(authenticate, tenantMiddleware);

router.get('/customer/:customerId', ctrl.getByCustomer);
router.get('/:id/history', ctrl.getHistory);
router.post('/', validateDto(CreateMotorcycleDto), ctrl.createMotorcycle);
router.put('/:id', validateDto(UpdateMotorcycleDto), ctrl.updateMotorcycle);

export default router;
