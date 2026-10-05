export type Strength = {
  score: 0 | 1 | 2 | 3 | 4; // 0 = terrible, 4 = strong
  label: string;
  hints: string[];
};

const COMMON = [
  'password', '12345678', 'qwerty', 'letmein', 'admin',
  'welcome', 'iloveyou', 'monkey', 'dragon', 'football',
];

export function checkPassword(pw: string): Strength {
  const hints: string[] = [];
  let score = 0;

  if (!pw) return { score: 0, label: 'Empty', hints: ['Enter a password'] };

  // Length
  if (pw.length >= 8) score++;
  else hints.push('Use at least 8 characters');

  if (pw.length >= 12) score++;

  // Variety
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);

  const variety = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  if (variety >= 3) score++;
  else if (variety < 3) hints.push('Mix letters, numbers, and a symbol');

  // Common passwords
  if (COMMON.some((c) => pw.toLowerCase().includes(c))) {
    score = Math.max(0, score - 2) as any;
    hints.push('Avoid common words like "password" or "welcome"');
  }

  // Cap
  const finalScore = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;

  const labels = ['Very weak', 'Weak', 'Okay', 'Good', 'Strong'];
  return {
    score: finalScore,
    label: labels[finalScore],
    hints,
  };
}