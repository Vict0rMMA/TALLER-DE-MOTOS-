import { Router } from 'express';
import * as ctrl from '../../controllers/inventoryController';
import { validateDto } from '../../middlewares/validateDto';
import { authenticate } from '../../middlewares/authMiddleware';
import { tenantMiddleware } from '../../middlewares/tenantMiddleware';
import { CreateProductDto } from '../../../infrastructure/validators/inventory/CreateProductDto';
import { UpdateProductDto } from '../../../infrastructure/validators/inventory/UpdateProductDto';
import { StockMovementDto } from '../../../infrastructure/validators/inventory/StockMovementDto';

const router = Router();
router.use(authenticate, tenantMiddleware);

router.get('/', ctrl.listProducts);
router.get('/low-stock', ctrl.getLowStock);
router.get('/:id', ctrl.getProduct);
router.post('/', validateDto(CreateProductDto), ctrl.createProduct);
router.put('/:id', validateDto(UpdateProductDto), ctrl.updateProduct);
router.delete('/:id', ctrl.deleteProduct);
router.post('/movements', validateDto(StockMovementDto), ctrl.registerMovement);

export default router;
