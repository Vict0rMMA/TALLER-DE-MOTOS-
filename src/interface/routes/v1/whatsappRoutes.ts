import { Router } from 'express';
import {
  cancelWhatsAppPairingCode,
  getWhatsAppStatus,
  requestWhatsAppPairingCode,
  restartWhatsApp,
} from '../../../infrastructure/whatsapp/WhatsAppWebService';
import { authenticate } from '../../middlewares/authMiddleware';

const router = Router();
router.use(authenticate);

router.get('/status', (_req, res) => {
  res.json(getWhatsAppStatus());
});

router.get('/qr', (_req, res) => {
  const status = getWhatsAppStatus();
  if (!status.enabled) return res.status(503).json({ error: 'WhatsApp no disponible en este servidor' });
  if (!status.hasQr) return res.status(404).json({ error: 'No hay QR disponible', isReady: status.isReady });
  res.json({ qr: status.qr });
});

router.post('/pairing-code', async (req, res) => {
  const phone = req.body?.phone ?? req.body?.phoneNumber;
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ error: 'Indica el número de WhatsApp del taller (campo phone)' });
  }
  try {
    const code = await requestWhatsAppPairingCode(phone);
    res.json({ ok: true, code, ...getWhatsAppStatus() });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'No se pudo generar el código';
    res.status(400).json({ error: message });
  }
});

router.post('/pairing-code/cancel', async (_req, res) => {
  try {
    await cancelWhatsAppPairingCode();
    res.json({ ok: true, ...getWhatsAppStatus() });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'No se pudo cancelar';
    res.status(400).json({ error: message });
  }
});

router.post('/restart', async (req, res) => {
  const deleteSession = req.query.force === 'true';
  restartWhatsApp(deleteSession).catch(() => {});
  res.json({ ok: true, message: deleteSession ? 'Reiniciando con sesión borrada…' : 'Reiniciando…' });
});

router.post('/logout', async (_req, res) => {
  try {
    await restartWhatsApp(true);
    res.json({ ok: true, message: 'Sesión cerrada y reiniciando…' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
