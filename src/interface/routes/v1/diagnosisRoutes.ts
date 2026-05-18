import { Router } from 'express';
import * as ctrl from '../../controllers/diagnosisController';
import { validateDto } from '../../middlewares/validateDto';
import { authenticate } from '../../middlewares/authMiddleware';
import { tenantMiddleware } from '../../middlewares/tenantMiddleware';
import { RunDiagnosisDto } from '../../../infrastructure/validators/diagnosis/RunDiagnosisDto';

const router = Router();
router.use(authenticate, tenantMiddleware);

router.get('/status', ctrl.getDiagnosisStatus);
router.get('/', ctrl.listDiagnosis);
router.get('/motorcycle/:motorcycleId', ctrl.getDiagnosisHistory);
router.post('/', validateDto(RunDiagnosisDto), ctrl.runDiagnosis);

export default router;
