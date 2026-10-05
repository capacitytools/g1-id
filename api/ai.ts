export const config = { runtime: 'edge' };

const API_KEY = process.env.OPENROUTER_API_KEY || '';
const BASE = 'https://openrouter.ai/api/v1';

// Non-reasoning models only. These produce direct output, no thinking.
const MODELS = [
  'inclusionai/ling-3.1-flash',
  'qwen/qwen3.8-max-0902',
  'nvidia/nemotron-3.5-lightning:free',
  'apodex/apodex-1.1-mini:free',
];

const DEFAULT_SYSTEM = `You are G1 AI, a professional writing assistant.

Your ONLY job is to produce clean, finished text. You never think out loud. You never show your reasoning. You never explain what you are doing. You never list options. You never say "here is" or "thinking" or "step 1". You write the finished text directly.

Hard rules:
- Output ONLY the requested text. Nothing else.
- Never use hashtags, emojis, or quotation marks.
- Never start with "I am a" or "I'm a".
- Never use the word "passionate".
- Never use bullet lists.`;

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
      transforms: ['middle-out'],
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
  let out = data?.choices?.[0]?.message?.content;
  if (!out) throw new Error(`${model}: empty response`);

  out = (out as string).trim();

  // Post-process: strip out any leaked reasoning
  out = cleanOutput(out);

  if (!out) throw new Error(`${model}: empty after cleaning`);
  return out;
}

/**
 * Clean up leaked reasoning from the model's output.
 * Removes thinking blocks, headers, meta-commentary, and option lists.
 */
function cleanOutput(text: string): string {
  let out = text;

  // Strip "Here's a thinking process:" and everything before the first bio-like line
  out = out.replace(/^[\s\S]*?(?:thinking process|analyze the request|output style|constraints)[\s\S]*?\n\n/gi, '');

  // Remove markdown bold/headers
  out = out.replace(/\*\*/g, '');
  out = out.replace(/^#+\s*/gm, '');

  // Remove leading labels like "Bio:", "Output:", "Result:"
  out = out.replace(/^(bio|output|result|answer|final):\s*/i, '');

  // Remove lines that are clearly reasoning
  out = out
    .split('\n')
    .filter((line) => {
      const l = line.trim().toLowerCase();
      if (!l) return true;
      if (l.startsWith('here is') || l.startsWith('here\'s')) return false;
      if (l.startsWith('thinking') || l.startsWith('analysis')) return false;
      if (l.startsWith('step ') || /^\d+\.\s/.test(l)) return false;
      if (l.startsWith('-') && l.length < 80) return false;
      if (l.startsWith('*') && l.length < 80) return false;
      if (l.startsWith('constraints:')) return false;
      if (l.startsWith('role:')) return false;
      if (l.startsWith('output style:')) return false;
      if (l.startsWith('no thinking')) return false;
      if (l.startsWith('only the requested')) return false;
      return true;
    })
    .join('\n')
    .trim();

  // Remove any remaining quotes if the whole thing is wrapped in them
  out = out.replace(/^["']|["']$/g, '');

  return out.trim();
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
    temperature: temperature ?? 0.5,
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