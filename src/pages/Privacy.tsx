import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Visibility = 'public' | 'connections' | 'private';

type PrivacyMap = Record<string, Visibility>;

const FIELDS: { key: string; label: string; desc: string }[] = [
  { key: 'profile',   label: 'Profile',      desc: 'Your name, photo, bio' },
  { key: 'email',     label: 'Email',        desc: 'Your email address' },
  { key: 'phone',     label: 'Phone',        desc: 'Your phone number' },
  { key: 'skills',    label: 'Skills',       desc: 'Your skills and experience' },
  { key: 'business',  label: 'Business',     desc: 'Your business info' },
  { key: 'activity',  label: 'Activity',     desc: 'Your recent activity' },
];

const OPTIONS: { value: Visibility; label: string }[] = [
  { value: 'public',      label: 'Public' },
  { value: 'connections', label: 'Connections' },
  { value: 'private',     label: 'Private' },
];

export default function Privacy({ session }: { session: any }) {
  const [visibility, setVisibility] = useState<PrivacyMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('privacy_settings')
        .select('visibility')
        .eq('user_id', session.user.id)
        .single();

      const base: PrivacyMap = {
        profile: 'public',
        email: 'private',
        phone: 'private',
        skills: 'public',
        business: 'public',
        activity: 'connections',
      };

      setVisibility({ ...base, ...(data?.visibility || {}) });
      setLoading(false);
    })();
  }, [session]);

  function set(key: string, value: Visibility) {
    setVisibility((v) => ({ ...v, [key]: value }));
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from('privacy_settings')
      .upsert(
        { user_id: session.user.id, visibility },
        { onConflict: 'user_id' }
      );
    setSaving(false);
    if (error) return alert(error.message);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <div className="g1-spinner" />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Privacy</h1>
      </header>

      <p className="page__sub">Who can see you? Control what's visible across the G1 ecosystem.</p>

      {saved && <div className="auth-alert auth-alert--success">Privacy settings saved</div>}

      <div className="priv-list">
        {FIELDS.map((f) => (
          <div key={f.key} className="priv-row">
            <div className="priv-row__meta">
              <strong>{f.label}</strong>
              <small>{f.desc}</small>
            </div>
            <div className="priv-row__opts" role="radiogroup" aria-label={f.label}>
              {OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={'priv-opt' + (visibility[f.key] === o.value ? ' is-active' : '')}
                  onClick={() => set(f.key, o.value)}
                  role="radio"
                  aria-checked={visibility[f.key] === o.value}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        className="g1-btn g1-btn--solid g1-btn--full"
        style={{ marginTop: 24 }}
        onClick={save}
        disabled={saving}
      >
        {saving ? 'Saving…' : 'Save privacy settings'}
      </button>

      <p className="sec-note">
        Public: visible to anyone with your G1 link. Connections: only people you connect with.
        Private: only you.
      </p>
    </div>
  );
}