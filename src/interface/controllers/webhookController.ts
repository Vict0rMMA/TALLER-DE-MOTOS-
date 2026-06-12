import { Request, Response } from 'express';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? 'motobrain_webhook_token';

export const verifyWebhook = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.status(403).json({ error: 'Verify token inválido' });
};

export const handleWebhook = (req: Request, res: Response) => {
  const body = req.body;

  if (body.object !== 'whatsapp_business_account') {
    return res.status(404).json({ error: 'Objeto no reconocido' });
  }

  const messages = body.entry?.[0]?.changes?.[0]?.value?.messages ?? [];
  for (const _msg of messages) {
  }

  res.status(200).json({ status: 'EVENT_RECEIVED' });
};
