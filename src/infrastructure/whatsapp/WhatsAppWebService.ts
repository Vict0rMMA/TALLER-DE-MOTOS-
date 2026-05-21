import { Client, LocalAuth } from 'whatsapp-web.js';
import QRCodeLib from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { WhatsAppService } from '../../domain/services/WhatsAppService';

let qrBase64: string | null = null;
let isReady = false;
let client: Client | null = null;
let lastError: string | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const RECONNECT_MS = 15_000;

function clearReconnectTimer(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleReconnect(): void {
  if (process.env.ENABLE_WHATSAPP !== 'true' || !isWhatsAppRuntimeSupported()) return;
  clearReconnectTimer();
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (client) return;
    console.log('[WhatsApp] Reconectando automáticamente…');
    client = buildClient();
  }, RECONNECT_MS);
}

/** whatsapp-web.js + Puppeteer requieren proceso largo, disco y Chrome — no serverless (Vercel). */
export function isWhatsAppRuntimeSupported(): boolean {
  return process.env.VERCEL !== '1';
}

function assertWhatsAppRuntime(): void {
  if (!isWhatsAppRuntimeSupported()) {
    throw new Error(
      'WhatsApp no puede ejecutarse en Vercel. Despliega la API en un VPS (Railway, Render, Fly.io) o en local con npm run dev.',
    );
  }
}

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/run/current-system/sw/bin/chromium',   // Nix / Linux
  '/usr/bin/chromium-browser',             // Ubuntu/Debian
  '/usr/bin/chromium',                     // Alpine / Ubuntu snap
  '/snap/bin/chromium',                    // Ubuntu 22.04 (snap)
  '/usr/bin/google-chrome-stable',         // Google Chrome Linux
  '/usr/bin/google-chrome',               // Google Chrome Linux
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Users\\' + (process.env.USERNAME ?? '') + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean) as string[];

function findChrome(): string | undefined {
  return CHROME_CANDIDATES.find((p) => {
    try { return fs.existsSync(p); } catch { return false; }
  });
}

async function qrToBase64(qr: string): Promise<string> {
  return QRCodeLib.toDataURL(qr, { width: 280, margin: 2 });
}

function buildClient(): Client {
  const executablePath = findChrome();

  const c = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    puppeteer: {
      headless: true,
      protocolTimeout: 120000,
      ...(executablePath ? { executablePath } : {}),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-first-run',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--window-size=800,600',
      ],
    },
  });

  c.on('qr', async (qr) => {
    qrBase64 = await qrToBase64(qr).catch(() => null);
    isReady = false;
    lastError = null;
  });

  c.on('authenticated', () => {
    lastError = null;
  });

  c.on('ready', () => {
    isReady = true;
    qrBase64 = null;
    lastError = null;
  });

  c.on('auth_failure', (msg) => {
    console.error('[WhatsApp] Fallo de autenticación:', msg);
    isReady = false;
    qrBase64 = null;
    lastError = 'auth_failure';
    client = null;
    scheduleReconnect();
  });

  c.on('disconnected', (reason) => {
    console.warn('[WhatsApp] Desconectado:', reason);
    isReady = false;
    client = null;
    scheduleReconnect();
  });

  c.initialize().catch((err) => {
    console.error('[WhatsApp] Error al inicializar:', err.message);
    lastError = err.message;
    client = null;
    scheduleReconnect();
  });

  return c;
}

function getClient(): Client {
  assertWhatsAppRuntime();
  if (!client) {
    client = buildClient();
  }
  return client;
}

export function getWhatsAppStatus() {
  const wantsEnabled = process.env.ENABLE_WHATSAPP === 'true';
  const supported = isWhatsAppRuntimeSupported();
  const enabled = wantsEnabled && supported;
  let disabledReason: 'env_disabled' | 'vercel_serverless' | null = null;
  if (!enabled) {
    if (!supported) disabledReason = 'vercel_serverless';
    else if (!wantsEnabled) disabledReason = 'env_disabled';
  }
  return {
    isReady: enabled ? isReady : false,
    hasQr: enabled ? !!qrBase64 : false,
    qr: enabled ? qrBase64 : null,
    error: enabled ? lastError : null,
    enabled,
    wantsEnabled,
    supported,
    disabledReason,
    /** @deprecated use disabledReason */
    unsupportedReason: disabledReason === 'vercel_serverless' ? 'vercel_serverless' as const : null,
  };
}

export async function restartWhatsApp(deleteSession = false): Promise<void> {
  if (process.env.ENABLE_WHATSAPP !== 'true') {
    throw new Error('WhatsApp no está habilitado en este servidor');
  }
  assertWhatsAppRuntime();
  clearReconnectTimer();
  if (client) {
    try { await client.destroy(); } catch {}
    client = null;
  }
  isReady = false;
  qrBase64 = null;
  lastError = null;

  if (deleteSession) {
    const sessionPath = path.resolve('.wwebjs_auth');
    try {
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
      }
    } catch (e) {
      console.warn('[WhatsApp] No se pudo eliminar la sesión:', e);
    }
  }

  client = buildClient();
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('57') && digits.length === 12) return `${digits}@c.us`;
  if (digits.length === 10) return `57${digits}@c.us`;
  return `${digits}@c.us`;
}

export class WhatsAppWebService implements WhatsAppService {
  private readonly wa: Client;

  constructor() {
    this.wa = getClient();
  }

  async sendMessage(phone: string, message: string): Promise<void> {
    if (!isReady) {
      console.warn('[WhatsApp] No conectado — mensaje no enviado a', phone);
      return;
    }
    const chatId = formatPhone(phone);
    await this.wa.sendMessage(chatId, message);
  }

  async sendTemplate(phone: string, templateId: string, params: Record<string, string>): Promise<void> {
    const messages: Record<string, (p: Record<string, string>) => string> = {
      maintenance_reminder: (p) =>
        `🏍️ *MotoBrain* — Recordatorio de mantenimiento\n\nHola ${p['1']}, tu moto placa *${p['2']}* tiene mantenimiento programado en *${p['3']} días*.\n\nReserva tu cita en el taller. ¡Te esperamos! 🔧`,

      service_completed: (p) =>
        `✅ *MotoBrain* — Servicio completado\n\nHola ${p['1']}, tu moto placa *${p['2']}* ya está lista.\n\n📋 *Trabajo realizado:* ${p['3'] ?? 'Servicio de mantenimiento'}\n💰 *Total:* $${p['4'] ?? '0'}\n\n¡Puedes pasar a recogerla! Gracias por confiar en nosotros 🙏`,

      low_stock_alert: (p) =>
        `⚠️ *MotoBrain* — Alerta de stock bajo\n\nEl producto *${p['1']}* tiene solo *${p['2']} unidades* en stock (mínimo: ${p['3']}).\n\nEs momento de reabastecer. 📦`,

      diagnosis_ready: (p) =>
        `🤖 *MotoBrain IA* — Diagnóstico listo\n\nHola ${p['1']}, el diagnóstico de tu moto *${p['2']}* está disponible.\n\nContacta al taller para más detalles. 🔍`,

      consultation_answered: (p) =>
        `💬 *MotoBrain* — El taller respondió tu consulta\n\nHola ${p['1']}, sobre tu moto *${p['2']}*:\n\n${p['3']}\n\n${p['4'] ? `💰 *Precio confirmado:* ${p['4']}\n\n` : ''}Entra al portal del cliente para ver el detalle. 🔧`,

      appointment_confirmed: (p) =>
        `📅 *MotoBrain* — Cita confirmada\n\nHola ${p['1']}, tu cita para la moto *${p['2']}* quedó agendada:\n\n🕐 *${p['3']}*\n\nTe esperamos en el taller. Si necesitas cambiarla, escríbenos por WhatsApp.`,
    };

    const builder = messages[templateId];
    const text = builder ? builder(params) : `MotoBrain: ${JSON.stringify(params)}`;
    await this.sendMessage(phone, text);
  }
}
