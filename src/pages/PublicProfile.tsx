import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { avatarUrl } from '../lib/cloudinary';
import { G1_ROLES, RoleKey } from '../lib/g1';
import { G1Wordmark } from '../components/G1Logo';

export default function PublicProfile() {
  const { handle } = useParams<{ handle: string }>();
  const username = (handle || '').replace(/^@/, '').toLowerCase();

  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<RoleKey[]>([]);
  const [privacy, setPrivacy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, location, verified, verification_level, created_at')
        .eq('username', username)
        .maybeSingle();

      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: r } = await supabase
        .from('roles')
        .select('role')
        .eq('user_id', p.id);

      const { data: priv } = await supabase
        .from('privacy_settings')
        .select('visibility')
        .eq('user_id', p.id)
        .maybeSingle();

      setProfile(p);
      setRoles((r || []).map((x: any) => x.role));
      setPrivacy(priv?.visibility || {});
      setLoading(false);
    })();
  }, [username]);

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}>
        <div className="g1-spinner" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="pub">
        <div className="pub__empty">
          <h1>@ {username}</h1>
          <p>This G1 ID doesn't exist.</p>
          <Link to="/" className="g1-btn g1-btn--solid">Go to G1 ID</Link>
        </div>
      </div>
    );
  }

  const isPublic = (field: string) => (privacy?.[field] || 'public') === 'public';
  const roleLabels = G1_ROLES.filter((r) => roles.includes(r.key));

  return (
    <div className="pub">
      <header className="pub__bar">
        <Link to="/"><G1Wordmark height={24} /></Link>
      </header>

      <section className="pub__hero">
        <div className="pub__avatar">
          {profile.avatar_url ? (
            <img src={avatarUrl(profile.avatar_url, 240)} alt="" />
          ) : (
            <span>{(profile.display_name || profile.username || '?')[0].toUpperCase()}</span>
          )}
        </div>
        <h1 className="pub__name">{profile.display_name || profile.username}</h1>
        <p className="pub__handle">
          @{profile.username}
          {profile.verified && <span className="pub__verified">✓</span>}
        </p>

        <div className="pub__roles">
          {roleLabels.map((r) => (
            <span key={r.key} className="pub__role">{r.emoji} {r.label}</span>
          ))}
        </div>
      </section>

      <section className="pub__sections">
        {isPublic('profile') && profile.bio && (
          <div className="pub__section">
            <h3>About</h3>
            <p>{profile.bio}</p>
          </div>
        )}

        {isPublic('profile') && profile.location && (
          <div className="pub__section">
            <h3>Location</h3>
            <p>{profile.location}</p>
          </div>
        )}

        <div className="pub__section">
          <h3>Member since</h3>
          <p>{new Date(profile.created_at).toLocaleDateString('en-GB', {
            month: 'long', year: 'numeric',
          })}</p>
        </div>
      </section>

      <div className="pub__cta">
        <Link to="/signup" className="g1-btn g1-btn--solid g1-btn--full">
          Create your G1 ID
        </Link>
        <p className="pub__note">
          G1 digital identity — not government identification.
        </p>
      </div>
    </div>
  );
}