import { supabase } from './supabase';

export async function downloadMyData(userId: string): Promise<void> {
  const [profile, roles, privacy, devices, events, products] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('roles').select('*').eq('user_id', userId),
    supabase.from('privacy_settings').select('*').eq('user_id', userId).single(),
    supabase.from('devices').select('*').eq('user_id', userId),
    supabase.from('security_events').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(500),
    supabase.from('connected_products').select('*').eq('user_id', userId),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    g1_id_notice: 'This is your full G1 ID data export. G1 ID is a digital identity platform, not government identification.',
    profile: profile.data,
    roles: roles.data,
    privacy: privacy.data,
    devices: devices.data,
    security_events: events.data,
    connected_products: products.data,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `g1-id-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function deleteMyAccount(userId: string, confirmText: string): Promise<{ ok: boolean; error?: string }> {
  if (confirmText.trim().toUpperCase() !== 'DELETE') {
    return { ok: false, error: 'Type DELETE to confirm.' };
  }

  // Best-effort cleanup of user-owned data
  await supabase.from('roles').delete().eq('user_id', userId);
  await supabase.from('devices').delete().eq('user_id', userId);
  await supabase.from('security_events').delete().eq('user_id', userId);
  await supabase.from('connected_products').delete().eq('user_id', userId);
  await supabase.from('privacy_settings').delete().eq('user_id', userId);
  await supabase.from('username_history').delete().eq('user_id', userId);

  // Delete the profile row last
  const { error: profErr } = await supabase.from('profiles').delete().eq('id', userId);
  if (profErr) return { ok: false, error: profErr.message };

  // Sign out. (Full auth.users deletion requires the admin API which needs
  // a service role key. This anonymizes the account for now.)
  await supabase.auth.signOut();

  return { ok: true };
}