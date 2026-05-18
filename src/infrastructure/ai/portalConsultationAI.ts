import { env } from '../config/env';
import { DomainError } from '../../domain/errors/DomainError';

export type PortalConsultRoute = 'ai' | 'mechanic';

export type PortalConsultAIResult = {
  routedTo: PortalConsultRoute;
  response: string;
  minPrice: number | null;
  maxPrice: number | null;
};

const PORTAL_SYSTEM = `Eres MotoBrain AI, asistente amable del portal de clientes de un taller de motos en Colombia.
Respondes SIEMPRE en español, tono cercano y claro (el cliente NO es mecánico).

Debes clasificar cada consulta y actuar según la ruta:

## Ruta "ai" — responde tú (consultas genéricas)
Usa esta ruta cuando la pregunta NO requiere ver la moto en persona, por ejemplo:
- Consejos de ahorro de combustible, conducción, mantenimiento preventivo
- Cada cuánto cambiar aceite, bujías, filtros (orientación general)
- Qué tipo de aceite o lubricante usar (recomendación general)
- Precios orientativos de servicios comunes si tienes referencia del catálogo
- Preguntas sobre el proceso del taller, citas, tiempos aproximados de servicios estándar
- Dudas generales de mecánica explicadas en lenguaje simple

En ruta "ai": escribe 3-5 oraciones útiles. Si hay catálogo, usa esos precios. Si das rango de precio, pon minPrice y maxPrice en COP (números enteros).

## Ruta "mechanic" — deriva al técnico (consultas técnicas / que requieren inspección)
Usa esta ruta cuando hace falta revisar la moto, por ejemplo:
- Ruidos, vibraciones, humos, pérdidas de potencia, fallas intermitentes
- "No arranca", se apaga, fuga de aceite/líquidos, frenos que no frenan bien
- Problemas después de una reparación concreta en el taller
- Síntomas específicos en motor, transmisión, cadena, embrague, eléctrico
- Pedir diagnóstico exacto o presupuesto de una falla concreta sin inspección

En ruta "mechanic": NO inventes diagnóstico ni precio exacto. Explica en 2-3 oraciones que un mecánico del taller revisará la consulta y contactará al cliente. minPrice y maxPrice deben ser null.

Responde ÚNICAMENTE JSON válido:
{
  "routedTo": "ai" | "mechanic",
  "response": "texto para el cliente",
  "minPrice": null o número entero COP,
  "maxPrice": null o número entero COP
}`;

function buildUserMessage(symptom: string, motorcycleInfo: string, catalogSection: string) {
  return `MOTO: ${motorcycleInfo}
${catalogSection}

CONSULTA DEL CLIENTE:
"${symptom}"`;
}

function buildCatalogSection(catalogItems: { name: string; category: string; minPrice: unknown; maxPrice: unknown }[]) {
  if (!catalogItems.length) return '';
  return `\nCATÁLOGO DEL TALLER (referencia de precios COP):\n${catalogItems
    .map(
      (i) =>
        `- ${i.name} (${i.category}): $${Number(i.minPrice).toLocaleString('es-CO')} – $${Number(i.maxPrice).toLocaleString('es-CO')}`,
    )
    .join('\n')}`;
}

function fallbackRoute(symptom: string): PortalConsultAIResult {
  const s = symptom.toLowerCase();

  const genericHints = [
    'ahorrar gasolina',
    'ahorro de gasolina',
    'ahorro combustible',
    'cada cuanto',
    'cada cuánto',
    'cuando cambiar aceite',
    'cuándo cambiar aceite',
    'mantenimiento preventivo',
    'que aceite',
    'qué aceite',
    'recomiendas para',
    'recomienda para',
    'consejo',
    'tips',
    'horario',
  ];

  const technicalHints = [
    'ruido',
    'vibra',
    'humo',
    'no arranca',
    'se apaga',
    'falla',
    'fuga',
    'rechin',
    'golpet',
    'después del arreglo',
    'despues del arreglo',
    'arreglo que',
    'cadena',
    'frenos',
    'embrague',
    'motor',
    'electr',
    'batería',
    'bateria',
    'inyect',
    'carbur',
    'perdió potencia',
    'perdio potencia',
    'tembla',
  ];

  const isGeneric = genericHints.some((h) => s.includes(h));
  const isTechnical = technicalHints.some((h) => s.includes(h));

  if (isTechnical && !isGeneric) {
    return {
      routedTo: 'mechanic',
      response:
        'Tu consulta necesita que un mecánico revise la moto en persona para darte un diagnóstico y precio exactos. Ya la enviamos al taller; te contactarán pronto con la respuesta oficial.',
      minPrice: null,
      maxPrice: null,
    };
  }

  if (s.includes('ahorrar') || s.includes('gasolina')) {
    return {
      routedTo: 'ai',
      response:
        'Para ahorrar gasolina: mantén la cadena bien lubricada, revisa la presión de llantas, evita acelerones bruscos y haz el mantenimiento al día (filtro de aire y bujía). Un service de aceite a tiempo también ayuda. El mecánico puede revisar el estado general en tu próxima visita.',
      minPrice: 35000,
      maxPrice: 120000,
    };
  }

  return {
    routedTo: 'ai',
    response:
      'Gracias por tu consulta. Te recomendamos agendar una revisión en el taller para orientarte con precisión según el estado de tu moto.',
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
      temperature: 0.35,
      max_tokens: 1024,
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
      generationConfig: { temperature: 0.35, maxOutputTokens: 1024 },
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
