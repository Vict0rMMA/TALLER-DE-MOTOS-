import { env } from '../config/env';
import { DomainError } from '../../domain/errors/DomainError';

export type PortalConsultRoute = 'ai' | 'mechanic';

export type PortalConsultAIResult = {
  routedTo: PortalConsultRoute;
  response: string;
  minPrice: number | null;
  maxPrice: number | null;
};

const PORTAL_SYSTEM = `Eres MotoBrain, asistente técnico de un taller de motos en Colombia. Tu conocimiento equivale al de un mecánico con 15 años de experiencia en motos colombianas y latinoamericanas.

ESTILO: Directo, cálido, concreto. Como un mecánico de confianza, no un robot. Español colombiano natural.

PERSONALIZACIÓN OBLIGATORIA: Usa siempre los datos de la moto para dar una respuesta específica: viscosidad exacta del aceite para ESE motor, intervalo en km y meses, referencia de bujía, capacidad de aceite, presión de llantas, etc. Conoces a fondo: AKT (NKD 125/150, Special, Flex 125), Auteco/Bajaj (Pulsar 135/150/160/200/220/NS160, Boxer 100/150, Discover 125/150), Honda (CB190R, XR150, CB125F, CD70/100, Wave 110, CB300R), Yamaha (FZ150i, FZ-S, YBR125, Crypton 110, SZ-R 150, MT-03, R3), Suzuki (EN125-2A, GN125, GP150, Gixxer 150/155/250), TVS (Apache 160/200, Star City+ 110, Raider 125), Royal Enfield (Meteor 350, Classic 350, Bullet 350), KTM (Duke 200/390, RC 200/390), Kawasaki (Z125, Z400, Ninja 300/400), Benelli, UM, Loncin, entre otras.

---

RUTA "ai" — respondes tú (no se necesita ver la moto):
• Aceite del motor: qué viscosidad y tipo (mineral/semi/sintético, API), cuántos litros, cuándo cambiar en km y meses
• Filtros (aceite, aire, combustible): intervalos y especificaciones
• Bujía: referencia recomendada y cuándo cambiar
• Cadena: lubricación, tensión correcta, señales de desgaste, cuándo cambiar
• Llantas: presión correcta para esa moto (delantera/trasera), cuándo cambiar
• Pastillas/zapatas de freno: síntomas de desgaste, intervalos
• Líquido de frenos: cuándo cambiar, cuál usar (DOT 3/4)
• Ahorro de combustible: técnicas de conducción, componentes que influyen
• Luces del tablero: qué significa cada advertencia común
• Preparar la moto para viajes o condiciones específicas
• Precios de servicios (usa el catálogo del taller si disponible; si no, rangos realistas COP 2024-2025)
• SOAT, RTM (revisión técnico-mecánica), traspaso, documentación

RESPUESTA "ai": 3–5 oraciones muy concretas y personalizadas para ESA moto. Menciona valores exactos: viscosidad (ej. "10W-40 semi-sintético API SL o SN"), intervalo (ej. "cada 3.000 km o 3 meses"), capacidad (ej. "1.0 litro"), referencia cuando la conozcas. Usa precios del catálogo si hay; si no, da rangos COP. Incluye minPrice y maxPrice cuando el servicio tenga un costo estimable.

---

RUTA "mechanic" — deriva al taller (requiere inspección física):
• Ruidos: golpeteo, cascabel, rechinido, traqueteo al arrancar o conducir
• Humo (blanco = refrigerante, azul = aceite, negro = mezcla rica), olor a quemado
• Pérdida de potencia notable, tirones, hesitaciones al acelerar
• No arranca, arranca y se muere, arranca en frío pero no en caliente
• Fugas: aceite, gasolina, líquido de frenos, refrigerante
• Frenos esponjosos, manillar que vibra al frenar, freno que se traba
• Embrague que patina o duro, caja de cambios que no entra o se sale
• Eléctrico: batería que no carga, luces que parpadean, tablero que se apaga
• Síntomas nuevos después de una reparación en el taller

RESPUESTA "mechanic": 2–3 oraciones. Menciona 1–2 causas posibles sin dar diagnóstico definitivo (ej. "puede ser desgaste en las pastillas, el disco o un problema con el liquido de frenos"). Indica que el mecánico del taller revisará y contactará pronto. minPrice y maxPrice = null siempre.

---

RESPONDE ÚNICAMENTE con este JSON exacto (sin texto fuera del JSON):
{
  "routedTo": "ai" | "mechanic",
  "response": "texto para el cliente",
  "minPrice": null | entero COP,
  "maxPrice": null | entero COP
}`;

function buildUserMessage(symptom: string, motorcycleInfo: string, catalogSection: string) {
  return `MOTO DEL CLIENTE: ${motorcycleInfo}
${catalogSection}

CONSULTA: "${symptom}"`;
}

function buildCatalogSection(catalogItems: { name: string; category: string; minPrice: unknown; maxPrice: unknown; description?: string | null }[]) {
  if (!catalogItems.length) return '';
  return `\nCATÁLOGO DEL TALLER (precios reales COP):\n${catalogItems
    .map(
      (i) =>
        `- ${i.name} (${i.category}): $${Number(i.minPrice).toLocaleString('es-CO')} – $${Number(i.maxPrice).toLocaleString('es-CO')}${i.description ? ` — ${i.description}` : ''}`,
    )
    .join('\n')}`;
}

function fallbackRoute(symptom: string): PortalConsultAIResult {
  const s = symptom.toLowerCase();

  const technicalHints = [
    'ruido', 'vibra', 'humo', 'no arranca', 'se apaga', 'falla', 'fuga',
    'rechin', 'golpet', 'traquet', 'después del arreglo', 'despues del arreglo',
    'embrague', 'electr', 'batería', 'bateria', 'inyect', 'carbur',
    'perdió potencia', 'perdio potencia', 'tembla', 'sale humo', 'olor a',
    'frena mal', 'no frena', 'se traba', 'caja de cambios', 'no entra',
  ];

  const genericHints = [
    'ahorrar', 'ahorro', 'cada cuanto', 'cada cuánto', 'cuando cambiar', 'cuándo cambiar',
    'qué aceite', 'que aceite', 'qué aceite', 'mantenimiento', 'consejos', 'tips',
    'cuánto cuesta', 'cuanto cuesta', 'precio', 'soat', 'rtm', 'traspaso', 'horario',
  ];

  const isTechnical = technicalHints.some((h) => s.includes(h));
  const isGeneric = genericHints.some((h) => s.includes(h));

  if (isTechnical && !isGeneric) {
    return {
      routedTo: 'mechanic',
      response:
        'Eso que describes necesita que un mecánico revise la moto en persona para darte un diagnóstico exacto. Ya enviamos tu consulta al taller y te contactarán pronto. No sigas usando la moto si el problema es serio (fuga, frenos, pérdida de potencia brusca).',
      minPrice: null,
      maxPrice: null,
    };
  }

  if (s.includes('ahorrar') || s.includes('gasolina') || s.includes('combustible')) {
    return {
      routedTo: 'ai',
      response:
        'Para ahorrar gasolina: mantén la cadena bien lubricada y con la tensión correcta, revisa la presión de las llantas (baja presión aumenta el consumo), evita acelerones bruscos y mantén velocidad constante. Un filtro de aire sucio y una bujía gastada también disparan el consumo — revisalos en el próximo service.',
      minPrice: null,
      maxPrice: null,
    };
  }

  if (s.includes('aceite') || s.includes('cambio de aceite') || s.includes('cada cuánto') || s.includes('cada cuanto')) {
    return {
      routedTo: 'ai',
      response:
        'Para motos de 4 tiempos entre 100-200cc lo más común es cambiar el aceite cada 3.000 km o 3 meses (lo que llegue primero). Usa aceite 10W-40 semi-sintético o sintético API SL/SM; para motos de 125-150cc generalmente se usan 0,8 a 1,1 litros. Verifica en el manual de tu moto el grado exacto recomendado por el fabricante.',
      minPrice: 35000,
      maxPrice: 80000,
    };
  }

  return {
    routedTo: 'ai',
    response:
      'Recibimos tu consulta. Te recomendamos pasar por el taller para que el mecánico la evalúe de primera mano y te dé una respuesta precisa según el estado real de tu moto.',
    minPrice: null,
    maxPrice: null,
  };
}

function parseAIJson(raw: string): PortalConsultAIResult | null {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      routedTo?: string;
      response?: string;
      minPrice?: number | null;
      maxPrice?: number | null;
    };
    const routedTo = parsed.routedTo === 'mechanic' ? 'mechanic' : 'ai';
    const response = parsed.response?.trim();
    if (!response) return null;
    return {
      routedTo,
      response,
      minPrice: typeof parsed.minPrice === 'number' ? Math.round(parsed.minPrice) : null,
      maxPrice: typeof parsed.maxPrice === 'number' ? Math.round(parsed.maxPrice) : null,
    };
  } catch {
    return null;
  }
}

async function callGroq(userMessage: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: PORTAL_SYSTEM },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errBody = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new DomainError(errBody.error?.message ?? `Groq error ${response.status}`, 502);
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

async function callGemini(userMessage: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: PORTAL_SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1200, responseMimeType: 'application/json' },
    }),
  });

  if (!response.ok) throw new DomainError('Error al contactar Gemini API', 502);
  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function runPortalConsultationAI(
  symptom: string,
  motorcycleInfo: string,
  catalogItems: { name: string; category: string; minPrice: unknown; maxPrice: unknown; description?: string | null }[],
): Promise<PortalConsultAIResult> {
  if (!env.GROQ_API_KEY && !env.GEMINI_API_KEY) {
    throw new DomainError('IA no configurada en el servidor', 503);
  }

  const userMessage = buildUserMessage(symptom, motorcycleInfo, buildCatalogSection(catalogItems));

  try {
    const raw = env.GROQ_API_KEY ? await callGroq(userMessage) : await callGemini(userMessage);
    const parsed = parseAIJson(raw);
    if (parsed) return parsed;
  } catch (err) {
    console.error('[portalConsultationAI]', err);
  }

  return fallbackRoute(symptom);
}
