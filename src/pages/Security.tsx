import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { computeSecurityChecks, securityScore, timeAgo } from '../lib/security';
import { explainLogin } from '../lib/ai';
import G1AIButton from '../components/G1AIButton';

const EVENT_LABELS: Record<string, string> = {
  login: 'New login',
  logout: 'Signed out',
  password_change: 'Password changed',
  mfa_enabled: '2FA enabled',
  mfa_disabled: '2FA disabled',
  new_device: 'New device added',
  failed_login: 'Failed login attempt',
};

export default function Security({ session }: { session: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const { data: d } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', session.user.id)
        .order('last_seen_at', { ascending: false })
        .limit(10);

      const { data: e } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(15);

      setProfile(p);
      setDevices(d || []);
      setEvents(e || []);
      setLoading(false);
    })();
  }, [session]);

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <div className="g1-spinner" />
      </div>
    );
  }

  const checks = computeSecurityChecks(profile);
  const score = securityScore(checks);

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Security Center</h1>
      </header>

      <p className="page__sub">Protect your G1 ID. Review devices, activity, and enable stronger sign-in.</p>

      <section className="sec-score">
        <div className="sec-score__ring" style={{ '--pct': `${score}%` } as any}>
          <span>{score}%</span>
        </div>
        <div className="sec-score__info">
          <strong>Account protection</strong>
          <p>{checks.filter((c) => c.passed).length} of {checks.length} checks passed</p>
        </div>
      </section>

      <section className="sec-checks">
        {checks.map((c) => (
          <div key={c.key} className={'sec-check' + (c.passed ? ' is-ok' : '')}>
            <span className="sec-check__mark" aria-hidden>{c.passed ? '✓' : '○'}</span>
            <span className="sec-check__label">{c.label}</span>
            {!c.passed && <span className="sec-check__badge">Planned</span>}
          </div>
        ))}
      </section>

      <section className="sec-block">
        <h2 className="sec-block__title">Devices & sessions</h2>
        {devices.length === 0 && (
          <p className="sec-block__empty">No devices recorded yet.</p>
        )}
        {devices.map((d) => (
          <div key={d.id} className="sec-device">
            <div className="sec-device__icon" aria-hidden>
              {/Android|iOS/i.test(d.platform || '') ? '📱' : '💻'}
            </div>
            <div className="sec-device__meta">
              <strong>{d.label || 'Unknown device'}</strong>
              <small>Last seen {timeAgo(d.last_seen_at)}</small>
            </div>
            {d.current && <span className="sec-device__current">Current</span>}
          </div>
        ))}
      </section>

      <section className="sec-block">
        <h2 className="sec-block__title">Recent activity</h2>
        {events.length === 0 && (
          <p className="sec-block__empty">No activity yet.</p>
        )}
        {events.map((e) => (
          <div key={e.id} className="sec-event-block">
            <div className="sec-event">
              <div className="sec-event__dot" />
              <div className="sec-event__meta">
                <strong>{EVENT_LABELS[e.kind] || e.kind}</strong>
                <small>
                  {e.metadata?.platform ? `${e.metadata.platform} · ${e.metadata.browser || ''}` : ''}
                  {' · '}{timeAgo(e.created_at)}
                </small>
              </div>
            </div>
            <G1AIButton
              label="Explain this"
              loadingLabel="Reading…"
              compact
              onRun={() =>
                explainLogin({
                  kind: EVENT_LABELS[e.kind] || e.kind,
                  platform: e.metadata?.platform,
                  browser: e.metadata?.browser,
                  when: timeAgo(e.created_at),
                })
              }
            />
          </div>
        ))}
      </section>

      <p className="sec-note">
        Advanced features — passkeys, 2FA, and recovery — are being built.
      </p>
    </div>
  );
}