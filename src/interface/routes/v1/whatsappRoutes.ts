import { Router } from 'express';
import { getWhatsAppStatus, restartWhatsApp } from '../../../infrastructure/whatsapp/WhatsAppWebService';
import { authenticate } from '../../middlewares/authMiddleware';

const router = Router();
router.use(authenticate);

router.get('/status', (_req, res) => {
  res.json(getWhatsAppStatus());
});

router.post('/restart', async (req, res) => {
  const deleteSession = req.query.force === 'true';
  restartWhatsApp(deleteSession).catch(() => {});
  res.json({ ok: true, message: deleteSession ? 'Reiniciando con sesión borrada…' : 'Reiniciando…' });
});

export default router;
