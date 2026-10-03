import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { G1_ROLES, RoleKey } from '../lib/g1';
import { suggestRoles } from '../lib/ai';
import G1AIButton from '../components/G1AIButton';

export default function Roles({ session }: { session: any }) {
  const [roles, setRoles] = useState<RoleKey[]>(['personal']);
  const [primary, setPrimary] = useState<RoleKey>('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [about, setAbout] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('roles')
        .select('role, is_primary')
        .eq('user_id', session.user.id);
      const list = (data || []).map((x: any) => x.role);
      if (list.length) setRoles(list);
      const p = (data || []).find((x: any) => x.is_primary);
      if (p) setPrimary(p.role);
      setLoading(false);
    })();
  }, [session]);

  function toggle(key: RoleKey) {
    if (key === 'personal') return;
    setRoles(
      roles.includes(key)
        ? roles.filter((r) => r !== key)
        : [...roles, key]
    );
  }

  async function save() {
    setSaving(true);
    await supabase.from('roles').delete().eq('user_id', session.user.id);
    await supabase.from('roles').insert(
      roles.map((r) => ({
        user_id: session.user.id,
        role: r,
        is_primary: r === primary,
      }))
    );
    setSaving(false);
    alert('Roles updated');
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
        <h1 className="page__title">My Roles</h1>
      </header>

      <p className="page__sub">
        One identity. Many roles. Add what describes you — you can switch anytime.
      </p>

      {/* G1 AI helper */}
      <div className="ai-card">
        <label className="ai-card__label">
          <span className="ai-card__spark">✨</span> Not sure which to pick?
        </label>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Tell G1 AI about yourself in one sentence…"
          className="g1-textarea ai-card__input"
          rows={2}
        />
        <G1AIButton
          label="Suggest roles for me"
          loadingLabel="Analyzing…"
          compact
          onRun={() => suggestRoles(about || 'A new user on G1')}
        />
      </div>

      <div className="roles-list">
        {G1_ROLES.map((r) => {
          const on = roles.includes(r.key);
          const isPrimary = primary === r.key;
          const locked = r.key === 'personal';
          return (
            <div key={r.key} className={'role-row' + (on ? ' is-on' : '')}>
              <button className="role-row__main" onClick={() => toggle(r.key)}>
                <span className="role-row__emoji">{r.emoji}</span>
                <span className="role-row__meta">
                  <strong>{r.label}</strong>
                  <small>{r.desc}</small>
                </span>
                <span className="role-row__check" aria-hidden>{on ? '✓' : ''}</span>
              </button>
              {on && !locked && (
                <button
                  className={'role-row__primary' + (isPrimary ? ' is-primary' : '')}
                  onClick={() => setPrimary(r.key)}
                >
                  {isPrimary ? '★ Primary' : 'Set primary'}
                </button>
              )}
              {on && locked && (
                <span className="role-row__primary is-primary">★ Primary</span>
              )}
            </div>
          );
        })}
      </div>

      <button
        className="g1-btn g1-btn--solid g1-btn--full"
        style={{ marginTop: 24 }}
        onClick={save}
        disabled={saving}
      >
        {saving ? 'Saving…' : 'Save roles'}
      </button>
    </div>
  );
}