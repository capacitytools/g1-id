const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const BASE = 'https://openrouter.ai/api/v1';

// Try these in order — if one fails, fall back to the next
const MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-flash-1.5-8b-exp:free',
  'mistralai/mistral-7b-instruct:free',
];

export type AIMessage = { role: 'user' | 'assistant'; text: string };

export type AIRequest = {
  system?: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
};

const DEFAULT_SYSTEM = `You are G1 AI, the built-in assistant for G1 ID — the identity layer of the G1-Tech Ecosystem.

Rules:
- Be concise. Prefer short, useful answers over long explanations.
- Never invent G1 features that don't exist. If unsure, say so.
- Never reveal private user data, tokens, or secrets.
- Never claim to be government identification.
- Match the user's tone. Be warm, human, and clear.
- When asked to write text (bios, descriptions), produce only the text, no quotes or labels.`;

async function callModel(model: string, req: AIRequest): Promise<string> {
  const body = {
    model,
    messages: [
      { role: 'system', content: req.system || DEFAULT_SYSTEM },
      ...req.messages.map((m) => ({ role: m.role, content: m.text })),
    ],
    max_tokens: req.maxTokens ?? 400,
    temperature: req.temperature ?? 0.7,
  };

  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      'HTTP-Referer': 'https://g1-id.vercel.app',
      'X-Title': 'G1 ID',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('G1 AI error', model, res.status, text);

    let detail = `HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error?.message) detail = parsed.error.message;
    } catch {}

    throw new Error(`G1 AI (${model}): ${detail}`);
  }

  const data = await res.json();
  const out = data?.choices?.[0]?.message?.content;
  if (!out) throw new Error('G1 AI returned an empty response.');
  return (out as string).trim();
}

export async function askG1AI(req: AIRequest): Promise<string> {
  if (!API_KEY) throw new Error('G1 AI is not configured yet.');

  let lastError: any = null;
  for (const model of MODELS) {
    try {
      return await callModel(model, req);
    } catch (e) {
      lastError = e;
      // Continue to next model
    }
  }
  // All models failed
  throw lastError || new Error('G1 AI is unavailable right now.');
}

export async function improveBio(currentBio: string, context: {
  displayName?: string;
  roles?: string[];
  location?: string;
}): Promise<string> {
  const prompt = `Rewrite and improve this G1 ID bio. Keep it under 180 characters. First person. Warm, confident, professional but human. Do not use hashtags, emojis, or quotation marks.

Current bio: ${currentBio || '(empty)'}

Context:
Name: ${context.displayName || '(not set)'}
Roles: ${context.roles?.join(', ') || '(none)'}
Location: ${context.location || '(not set)'}

Output only the improved bio text, nothing else.`;

  return askG1AI({
    messages: [{ role: 'user', text: prompt }],
    maxTokens: 200,
    temperature: 0.8,
  });
}

export async function suggestRoles(about: string): Promise<string> {
  const prompt = `A new G1 ID user described themselves as:

"${about}"

Which G1 roles best fit them? Available roles: Personal, Creator, Business, Expert, Farmer, Developer, Instructor.

Reply with: (1) the 2-3 best-fit roles, and (2) one short sentence of reasoning. Keep total reply under 220 characters.`;

  return askG1AI({
    messages: [{ role: 'user', text: prompt }],
    maxTokens: 180,
    temperature: 0.6,
  });
}

export async function explainLogin(meta: {
  platform?: string;
  browser?: string;
  kind?: string;
  when?: string;
}): Promise<string> {
  const prompt = `Explain this G1 ID account activity to a non-technical user in 1-2 short sentences. Reassure if it looks normal, warn if suspicious.

Activity: ${meta.kind || 'login'}
Device: ${meta.platform || 'unknown'} — ${meta.browser || 'unknown'}
When: ${meta.when || 'recently'}

Keep it under 200 characters. Plain English only.`;

  return askG1AI({
    messages: [{ role: 'user', text: prompt }],
    maxTokens: 160,
    temperature: 0.4,
  });
}

export async function suggestUsernames(name: string): Promise<string[]> {
  const prompt = `Suggest 5 available-looking G1 ID usernames for someone named "${name}".

Rules:
- lowercase letters, numbers, underscores only
- 3 to 18 characters
- avoid reserved words (admin, g1, support, help, root, system)
- no spaces

Reply with ONLY the 5 usernames, one per line. Nothing else.`;

  const text = await askG1AI({
    messages: [{ role: 'user', text: prompt }],
    maxTokens: 120,
    temperature: 0.9,
  });

  return text
    .split('\n')
    .map((s) => s.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''))
    .filter((s) => s.length >= 3 && s.length <= 24)
    .slice(0, 5);
}