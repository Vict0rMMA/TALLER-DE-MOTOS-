import { Router } from 'express';
import * as ctrl from '../../controllers/customerController';
import { validateDto } from '../../middlewares/validateDto';
import { authenticate } from '../../middlewares/authMiddleware';
import { tenantMiddleware } from '../../middlewares/tenantMiddleware';
import { CreateCustomerDto } from '../../../infrastructure/validators/customers/CreateCustomerDto';
import { UpdateCustomerDto } from '../../../infrastructure/validators/customers/UpdateCustomerDto';

const router = Router();
router.use(authenticate, tenantMiddleware);

router.get('/', ctrl.listCustomers);
router.get('/:id', ctrl.getCustomer);
router.post('/', validateDto(CreateCustomerDto), ctrl.createCustomer);
router.put('/:id', validateDto(UpdateCustomerDto), ctrl.updateCustomer);

export default router;
