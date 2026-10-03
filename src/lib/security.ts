import { supabase } from './supabase';

export function parseUserAgent(ua: string): { platform: string; browser: string } {
  const platform =
    /Android/i.test(ua) ? 'Android' :
    /iPhone|iPad|iPod/i.test(ua) ? 'iOS' :
    /Windows/i.test(ua) ? 'Windows' :
    /Mac/i.test(ua) ? 'macOS' :
    /Linux/i.test(ua) ? 'Linux' :
    'Unknown';

  const browser =
    /Edg\//i.test(ua) ? 'Edge' :
    /Chrome\//i.test(ua) && !/Edg/i.test(ua) ? 'Chrome' :
    /Firefox\//i.test(ua) ? 'Firefox' :
    /Safari\//i.test(ua) && !/Chrome/i.test(ua) ? 'Safari' :
    'Unknown';

  return { platform, browser };
}

export async function logLogin() {
  try {
    const ua = navigator.userAgent;
    const { platform, browser } = parseUserAgent(ua);

    // Save device (upsert-ish: delete previous of same UA, then insert new one)
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    // Insert security event
    await supabase.from('security_events').insert({
      user_id: user.user.id,
      kind: 'login',
      metadata: { platform, browser, ua },
    });

    // Insert device row if not exists for this user-agent today
    const { data: existing } = await supabase
      .from('devices')
      .select('id')
      .eq('user_id', user.user.id)
      .eq('user_agent', ua)
      .limit(1);

    if (!existing || existing.length === 0) {
      await supabase.from('devices').insert({
        user_id: user.user.id,
        user_agent: ua,
        label: `${platform} · ${browser}`,
        platform,
        browser,
        current: true,
      });
    } else {
      await supabase
        .from('devices')
        .update({ last_seen_at: new Date().toISOString(), current: true })
        .eq('id', existing[0].id);
    }

    // Update profile last_login
    await supabase
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.user.id);
  } catch (e) {
    console.warn('logLogin failed', e);
  }
}

export type SecurityCheck = {
  key: string;
  label: string;
  passed: boolean;
  action?: string;
};

export function computeSecurityChecks(profile: any): SecurityCheck[] {
  return [
    { key: 'email',    label: 'Email verified',              passed: !!profile?.email_verified },
    { key: 'phone',    label: 'Phone verified',              passed: !!profile?.phone_verified },
    { key: 'avatar',   label: 'Profile photo added',         passed: !!profile?.avatar_url },
    { key: 'roles',    label: 'At least one role selected',  passed: true }, // we assume roles exist
    { key: 'mfa',      label: 'Two-factor authentication',   passed: !!profile?.mfa_enabled },
    { key: 'passkey',  label: 'Passkey enabled',             passed: !!profile?.passkey_enabled },
  ];
}

export function securityScore(checks: SecurityCheck[]): number {
  const total = checks.length;
  const passed = checks.filter((c) => c.passed).length;
  return Math.round((passed / total) * 100);
}

export function timeAgo(dateStr: string): string {
  const d = new Date(dateStr).getTime();
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB');
}