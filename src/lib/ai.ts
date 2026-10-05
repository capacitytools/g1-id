export async function improveBio(currentBio: string, context: {
  displayName?: string;
  roles?: string[];
  location?: string;
}): Promise<string> {
  const roleCount = context.roles?.length || 0;
  const roleHint = roleCount > 3
    ? `Focus on 2-3 of: ${context.roles?.join(', ')}.`
    : `Roles: ${context.roles?.join(', ') || '(none)'}`;

  const prompt = `Write a professional bio for a G1 ID profile.

Person: ${context.displayName || 'Anonymous'}
Where: ${context.location || 'Unknown'}
${roleHint}
Current rough version: "${currentBio || '(empty)'}"

The bio must be:
- Under 150 characters
- First person, natural, sharp
- Concrete — mention what they actually do
- Not generic or corporate
- No lists. No "I am a". No hashtags. No emojis. No quotes.

Just write the bio. Do not explain. Do not show steps. Do not offer options.`;

  return askG1AI({
    messages: [{ role: 'user', text: prompt }],
    maxTokens: 150,
    temperature: 0.6,
  });
}