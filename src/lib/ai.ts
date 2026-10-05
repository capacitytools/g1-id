const ENDPOINT = '/api/ai';

export type AIMessage = { role: 'user' | 'assistant'; text: string };

export type AIRequest = {
  system?: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
};

const DEFAULT_SYSTEM = `You are G1 AI, the built-in writing assistant for G1 ID.

You write crisp, human, professional text. You never think out loud. You never explain yourself. You never list options. You produce the final polished text directly — nothing else.

Hard rules:
- Never use hashtags, emojis, or quotation marks.
- Never say "I am a" or "I'm a" at the start of a bio.
- Never list more than 3 things in a row.
- Never use the word "passionate".
- Never include reasoning, options, or commentary.
- Output ONLY the requested text.`;

export async function askG1AI(req: AIRequest): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: req.system || DEFAULT_SYSTEM,
      messages: req.messages,
      maxTokens: req.maxTokens,
      temperature: req.temperature,
    }),
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) detail = j.error;
    } catch {}
    if (res.status === 429) throw new Error('G1 AI is busy. Try again in a minute.');
    throw new Error(`G1 AI: ${detail}`);
  }

  const data = await res.json();
  if (!data?.text) throw new Error('G1 AI returned an empty response.');
  return (data.text as string).trim();
}

export async function improveBio(currentBio: string, context: {
  displayName?: string;
  roles?: string[];
  location?: string;
}): Promise<string> {
  const roleCount = context.roles?.length || 0;
  const roleHint = roleCount > 3
    ? `Pick the 2-3 most important from: ${context.roles?.join(', ')}.`
    : `Roles: ${context.roles?.join(', ') || '(none)'}`;

  const prompt = `Write a G1 ID bio.

Details:
- Name: ${context.displayName || '(not set)'}
- Location: ${context.location || '(not set)'}
- ${roleHint}

Current rough bio: "${currentBio || '(empty)'}"

Output a single first-person bio under 150 characters. Warm, sharp, concrete. No lists. No "I am a". No quotes. No emojis. No hashtags.

Output ONLY the bio. No explanations, no options, no commentary.`;

  return askG1AI({
    messages: [{ role: 'user', text: prompt }],
    maxTokens: 150,
    temperature: 0.8,
  });
}

export async function suggestRoles(about: string): Promise<string> {
  const prompt = `A new G1 ID user described themselves as:

"${about}"

Which G1 roles best fit them? Available roles: Personal, Creator, Business, Expert, Farmer, Developer, Instructor.

Reply with the 2-3 best-fit roles and one short sentence of reasoning. Under 220 characters total.`;

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
  const prompt = `Explain this G1 ID account activity to a non-technical user in 1-2 short sentences.

Activity: ${meta.kind || 'login'}
Device: ${meta.platform || 'unknown'} — ${meta.browser || 'unknown'}
When: ${meta.when || 'recently'}

Under 200 characters. Plain English only.`;

  return askG1AI({
    messages: [{ role: 'user', text: prompt }],
    maxTokens: 160,
    temperature: 0.4,
  });
}

export async function suggestUsernames(name: string): Promise<string[]> {
  const prompt = `Suggest 5 G1 ID usernames for someone named "${name}".

Rules:
- lowercase letters, numbers, underscores only
- 3 to 18 characters
- avoid reserved words (admin, g1, support, help, root, system)
- no spaces

Reply with ONLY the 5 usernames, one per line.`;

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