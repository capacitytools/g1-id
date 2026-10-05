export const config = { runtime: 'edge' };

const API_KEY = process.env.OPENROUTER_API_KEY || '';
const BASE = 'https://openrouter.ai/api/v1';

// Ordered by reliability + quality, based on live OpenRouter /models data.
// Model slugs change — if all fail, the app will show the exact error.
const MODELS = [
  'apodex/apodex-1.1-mini:free',
  'inclusionai/ling-3.1-flash',
  'nvidia/nemotron-3.5-lightning:free',
  'qwen/qwen3.8-max-0902',
];

const DEFAULT_SYSTEM = `You are G1 AI, the built-in writing assistant for G1 ID.

You write crisp, human, professional text. You never think out loud. You never explain yourself. You never list options. You produce the final polished text directly — nothing else.

Hard rules:
- Never use hashtags, emojis, or quotation marks.
- Never say "I am a" or "I'm a" at the start of a bio.
- Never list more than 3 things in a row.
- Never use the word "passionate".
- Never include reasoning, options, or commentary.
- Output ONLY the requested text.`;

const hits = new Map<string, { count: number; reset: number }>();
const LIMIT = 20;
const WINDOW_MS = 60_000;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (rec.count >= LIMIT) return false;
  rec.count += 1;
  return true;
}

async function callModel(model: string, body: any): Promise<string> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      'HTTP-Referer': 'https://g1-id.vercel.app',
      'X-Title': 'G1 ID',
    },
    body: JSON.stringify({
      ...body,
      model,
      reasoning: { exclude: true },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let detail = `HTTP ${res.status}`;
    try {
      const p = JSON.parse(text);
      if (p?.error?.message) detail = p.error.message;
    } catch {}
    throw new Error(`${model}: ${detail}`);
  }

  const data = await res.json();
  const out = data?.choices?.[0]?.message?.content;
  if (!out) throw new Error(`${model}: empty response`);
  return (out as string).trim();
}

export default async function handler(req: Request): Promise<Response> {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (!API_KEY) {
    return new Response(JSON.stringify({ error: 'G1 AI is not configured.' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (!rateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again in a minute.' }), {
      status: 429,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const { system, messages, maxTokens, temperature } = payload || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages array required' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const body = {
    messages: [
      { role: 'system', content: system || DEFAULT_SYSTEM },
      ...messages.map((m: any) => ({ role: m.role, content: m.text || m.content })),
    ],
    max_tokens: Math.min(maxTokens ?? 400, 800),
    temperature: temperature ?? 0.7,
  };

  const errors: string[] = [];
  for (const model of MODELS) {
    try {
      const text = await callModel(model, body);
      return new Response(JSON.stringify({ text }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      errors.push(e?.message || String(e));
    }
  }

  return new Response(JSON.stringify({ error: errors.join(' | ') }), {
    status: 500,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}