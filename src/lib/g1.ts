export type RoleKey =
  | 'personal' | 'creator' | 'business' | 'expert'
  | 'farmer' | 'developer' | 'instructor';

export const G1_ROLES: { key: RoleKey; label: string; emoji: string; desc: string }[] = [
  { key: 'personal',   label: 'Personal',   emoji: '👤', desc: 'Everyday identity' },
  { key: 'creator',    label: 'Creator',    emoji: '🎨', desc: 'Content, art, music' },
  { key: 'business',   label: 'Business',   emoji: '💼', desc: 'Sell, trade, operate' },
  { key: 'expert',     label: 'Expert',     emoji: '🧠', desc: 'Consult, advise' },
  { key: 'farmer',     label: 'Farmer',     emoji: '🌾', desc: 'Agro, produce, farm' },
  { key: 'developer',  label: 'Developer',  emoji: '💻', desc: 'Code, build, ship' },
  { key: 'instructor', label: 'Instructor', emoji: '🎓', desc: 'Teach, mentor' },
];

export const G1_PRODUCTS = [
  { key: 'chat',     label: 'G1-Chat',     accent: 'var(--g1-primary)' },
  { key: 'mail',     label: 'G1 Mail',     accent: '#2563EB' },
  { key: 'market',   label: 'G1 Market',   accent: '#EA580C' },
  { key: 'learn',    label: 'G1 Learn',    accent: '#7C3AED' },
  { key: 'business', label: 'G1 Business', accent: '#1E40AF' },
  { key: 'wallet',   label: 'G1 Wallet',   accent: '#065F46' },
  { key: 'ai',       label: 'G1 AI',       accent: '#0891B2' },
  { key: 'creator',  label: 'G1 Creator',  accent: '#8B5CF6' },
  { key: 'agro',     label: 'G1 Agro',     accent: '#0D9488' },
  { key: 'jobs',     label: 'G1 Jobs',     accent: '#1E3A8A' },
  { key: 'expert',   label: 'G1 Expert',   accent: '#0F8A5F' },
  { key: 'points',   label: 'G1 Points',   accent: '#CA8A04' },
];

export const RESERVED_USERNAMES = [
  'admin', 'g1', 'g1id', 'support', 'help', 'root', 'system',
  'official', 'staff', 'team', 'moderator', 'security', 'billing',
];

export function validateUsername(u: string): string | null {
  const v = u.trim().toLowerCase();
  if (!v) return 'Username is required';
  if (v.length < 3) return 'At least 3 characters';
  if (v.length > 24) return 'Max 24 characters';
  if (!/^[a-z0-9_]+$/.test(v)) return 'Only letters, numbers, and _';
  if (RESERVED_USERNAMES.includes(v)) return 'This username is reserved';
  if (/^_|_$/.test(v)) return 'Cannot start or end with _';
  return null;
}