export const config = { runtime: 'edge' };

const API_KEY = process.env.OPENROUTER_API_KEY || '';
const BASE = 'https://openrouter.ai/api/v1';

// Try these in order. First one usually works.
// Note: some free-tier slugs get retired by OpenRouter — we keep fallbacks.
const MODELS = [
  'openrouter/free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-chat-v3.1:free',
  'qwen/qwen3-235b-a22b:free',
];

const DEFAULT_SYSTEM = `You are G1 AI, the built-in writing assistant for G1 ID.

You write crisp, human, professional text. You never sound generic or corporate. You never list things unnecessarily. You write like a person, not a brochure.

Hard rules:
- Never use hashtags, emojis, or quotation marks.
- Never say "I am a" or "I'm a" at the start of a bio.
- Never list more than 3 things in a row.
- Never use the word "passionate".
- Match the requested character limit strictly.
- Output only the requested text. No labels, no explanations.`;

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
    body: JSON.stringify({ ...body, model }),
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