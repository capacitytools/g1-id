import { supabase } from './supabase';
import { G1_ROLES, RoleKey } from './g1';

export type SearchResult = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  verified: boolean;
  roles: RoleKey[];
  matchedOn: string; // what field matched: 'username' | 'name' | 'bio' | 'location'
};

/**
 * Search G1 users by username, display name, bio, or location.
 * Uses case-insensitive ILIKE queries.
 */
export async function searchG1(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  // Escape special Postgres ILIKE characters
  const escaped = q.replace(/[%_]/g, (m) => '\\' + m);
  const pattern = `%${escaped}%`;

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, location, avatar_url, verified')
    .or(
      [
        `username.ilike.${pattern}`,
        `display_name.ilike.${pattern}`,
        `bio.ilike.${pattern}`,
        `location.ilike.${pattern}`,
      ].join(',')
    )
    .eq('onboarding_complete', true)
    .limit(30);

  if (error || !profiles) {
    console.warn('searchG1 error', error);
    return [];
  }

  // Fetch roles for the matched profiles
  const ids = profiles.map((p: any) => p.id);
  let rolesByUser: Record<string, RoleKey[]> = {};

  if (ids.length) {
    const { data: roles } = await supabase
      .from('roles')
      .select('user_id, role')
      .in('user_id', ids);

    rolesByUser = (roles || []).reduce((acc: any, r: any) => {
      acc[r.user_id] = acc[r.user_id] || [];
      acc[r.user_id].push(r.role);
      return acc;
    }, {});
  }

  const lowerQ = q.toLowerCase();

  return profiles.map((p: any) => {
    const roles = rolesByUser[p.id] || [];
    let matchedOn = 'username';
    if (p.username?.toLowerCase().includes(lowerQ)) matchedOn = 'username';
    else if (p.display_name?.toLowerCase().includes(lowerQ)) matchedOn = 'name';
    else if (p.bio?.toLowerCase().includes(lowerQ)) matchedOn = 'bio';
    else if (p.location?.toLowerCase().includes(lowerQ)) matchedOn = 'location';

    return {
      id: p.id,
      username: p.username,
      display_name: p.display_name,
      bio: p.bio,
      location: p.location,
      avatar_url: p.avatar_url,
      verified: !!p.verified,
      roles,
      matchedOn,
    };
  });
}

/** Extract role filters for chips */
export function roleOptions(): { key: RoleKey; label: string; emoji: string }[] {
  return G1_ROLES.map((r) => ({ key: r.key, label: r.label, emoji: r.emoji }));
}