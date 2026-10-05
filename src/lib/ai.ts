const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const BASE = 'https://openrouter.ai/api/v1';

// Try these in order — first is Qwen3.8 (strong free model),
// then fallback to the router if the specific slug has changed.
const MODELS = [
  'qwen/qwen3.8-27b:free',
  'google/gemini-2.0-flash-exp:free',
  'openrouter/free',
];

export type AIMessage = { role: 'user' | 'assistant'; text: string };

export type AIRequest = {
  system?: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
};

const DEFAULT_SYSTEM = `You are G1 AI, the built-in writing assistant for G1 ID.

You write crisp, human, professional text. You never sound generic or corporate. You never list things unnecessarily. You write like a person, not a brochure.

Hard rules:
- Never use hashtags, emojis, or quotation marks.
- Never say "I am a" or "I'm a" at the start of a bio.
- Never list more than 3 things in a row.
- Never use the word "passionate".
- Match the requested character limit strictly.
- Output only the requested text. No labels, no explanations.`;

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
  const errors: string[] = [];
  for (const model of MODELS) {
    try {
      return await callModel(model, req);
    } catch (e: any) {
      errors.push(e?.message || String(e));
    }
  }
  throw new Error(errors.join(' | '));
}

/* ---------- Bio writer ---------- */

export async function improveBio(currentBio: string, context: {
  displayName?: string;
  roles?: string[];
  location?: string;
}): Promise<string> {
  const roleCount = context.roles?.length || 0;
  const roleHint = roleCount > 3
    ? `Pick the 2-3 most important from: ${context.roles?.join(', ')}. Do not list all of them.`
    : `Roles: ${context.roles?.join(', ') || '(none)'}`;

  const prompt = `Write a G1 ID bio for this person.

Name: ${context.displayName || '(not set)'}
Location: ${context.location || '(not set)'}
${roleHint}

Current bio (may be empty or rough): "${currentBio || '(empty)'}"

Requirements:
- Under 160 characters.
- First person.
- Warm, sharp, professional.
- Concrete and specific, not generic.
- No lists. No "I am a". No "passionate". No hashtags. No emojis. No quotes.
- Should feel like something a real person would write about themselves.

Style examples (do not copy):
- "Building calm software for messy problems. Lagos-based, remote-native."
- "Farmer turned developer. Selling fresh produce and shipping clean code."
- "Photographer, mentor, and small-business operator. I help people look sharp online."

Output ONLY the bio text.`;

  return askG1AI({
    messages: [{ role: 'user', text: prompt }],
    maxTokens: 200,
    temperature: 0.85,
  });
}

/* ---------- Role suggestion ---------- */

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

/* ---------- Login explainer ---------- */

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

/* ---------- Username ideas ---------- */

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