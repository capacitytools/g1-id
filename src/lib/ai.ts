const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const MODEL = 'gemini-1.5-flash';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export type AIMessage = { role: 'user' | 'model'; text: string };

export type AIRequest = {
  /** System prompt — G1 AI's identity and rules */
  system?: string;
  /** Conversation history. Last item should be role: 'user' */
  messages: AIMessage[];
  /** Max output tokens */
  maxTokens?: number;
  /** 0.0 = deterministic, 1.0 = creative */
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

export async function askG1AI(req: AIRequest): Promise<string> {
  if (!API_KEY) {
    throw new Error('G1 AI is not configured yet.');
  }

  const body = {
    systemInstruction: {
      parts: [{ text: req.system || DEFAULT_SYSTEM }],
    },
    contents: req.messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    generationConfig: {
      temperature: req.temperature ?? 0.7,
      maxOutputTokens: req.maxTokens ?? 400,
      topP: 0.9,
    },
  };

  const res = await fetch(`${BASE}/${MODEL}:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('G1 AI error', res.status, text);
    if (res.status === 400) throw new Error('G1 AI could not process that request.');
    if (res.status === 403) throw new Error('G1 AI key is invalid or expired.');
    if (res.status === 429) throw new Error('G1 AI is busy. Try again in a moment.');
    throw new Error('G1 AI is unavailable right now.');
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const part = candidate?.content?.parts?.[0]?.text;
  if (!part) throw new Error('G1 AI returned an empty response.');
  return part.trim();
}

/* ---------- High-level helpers used by the app ---------- */

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