import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { G1_ROLES, RoleKey } from '../lib/g1';
import { avatarUrl } from '../lib/cloudinary';
import { improveBio } from '../lib/ai';
import G1AIButton from '../components/G1AIButton';

export default function Identity({ session }: { session: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<RoleKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    const { data: r } = await supabase
      .from('roles')
      .select('role')
      .eq('user_id', session.user.id);

    setProfile(p);
    setRoles((r || []).map((x: any) => x.role));
    if (p) {
      setDisplayName(p.display_name || '');
      setBio(p.bio || '');
      setLocation(p.location || '');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [session]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        location: location.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id);
    setSaving(false);
    if (error) { alert(error.message); return; }
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
    load();
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <div className="g1-spinner" />
      </div>
    );
  }

  const roleLabels = G1_ROLES.filter((r) => roles.includes(r.key));

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">My Identity</h1>
        <button
          className="g1-btn g1-btn--ghost"
          style={{ minHeight: 40, padding: '0 16px', fontSize: 14 }}
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </header>

      {saved && <div className="auth-alert auth-alert--success">Profile updated</div>}

      <section className="id-hero">
        <div className="id-hero__avatar">
          {profile?.avatar_url ? (
            <img src={avatarUrl(profile.avatar_url, 200)} alt="" />
          ) : (
            <span>{(profile?.display_name || profile?.username || '?')[0].toUpperCase()}</span>
          )}
        </div>
        <h2 className="id-hero__name">{profile?.display_name || profile?.username}</h2>
        <p className="id-hero__handle">@{profile?.username}</p>
        <div className="id-hero__roles">
          {roleLabels.map((r) => (
            <span key={r.key} className="id-hero__role">
              {r.emoji} {r.label}
            </span>
          ))}
        </div>
      </section>

      {editing ? (
        <section className="id-form">
          <div className="g1-field">
            <label>Display name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>

          <div className="g1-field">
            <label>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell G1 who you are"
              className="g1-textarea"
            />
            <G1AIButton
              label="Improve my bio"
              loadingLabel="Writing…"
              acceptLabel="Use this bio"
              compact
              onRun={() => improveBio(bio, {
                displayName,
                roles: roleLabels.map((r) => r.label),
                location,
              })}
              onAccept={(text) => setBio(text)}
            />
          </div>

          <div className="g1-field">
            <label>Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
            />
          </div>

          <button className="g1-btn g1-btn--solid g1-btn--full" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </section>
      ) : (
        <section className="id-sections">
          <div className="id-section">
            <h3>About</h3>
            <p>{profile?.bio || 'No bio yet. Tap Edit to add one.'}</p>
          </div>
          <div className="id-section">
            <h3>Location</h3>
            <p>{profile?.location || 'Not set'}</p>
          </div>
          <div className="id-section">
            <h3>Member since</h3>
            <p>{new Date(profile?.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </section>
      )}
    </div>
  );
}