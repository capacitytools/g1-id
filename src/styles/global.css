import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { G1Wordmark } from '../components/G1Logo';
import { G1_ROLES, G1_PRODUCTS, RoleKey } from '../lib/g1';
import { avatarUrl } from '../lib/cloudinary';

export default function Home({ session }: { session: any }) {
  const nav = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<RoleKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (p && !p.onboarding_complete) {
        nav('/onboarding', { replace: true });
        return;
      }

      const { data: r } = await supabase
        .from('roles')
        .select('role')
        .eq('user_id', session.user.id);

      setProfile(p);
      setRoles((r || []).map((x: any) => x.role));
      setLoading(false);
    })();
  }, [session, nav]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (loading) return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}>
      <div className="g1-spinner" />
    </div>
  );

  const firstName = (profile?.display_name || '').split(' ')[0] || profile?.username;
  const roleLabels = G1_ROLES.filter((r) => roles.includes(r.key));

  return (
    <div className="home">
      <div className="home__top">
        <G1Wordmark height={26} />
        <button onClick={signOut} className="home__signout">Sign out</button>
      </div>

      <header className="home__greeting">
        <p className="home__hello">Welcome back,</p>
        <h1 className="home__name">{firstName}</h1>
        <p className="home__handle">
          @{profile?.username}
          {profile?.verified && <span className="home__verified">✓ Verified</span>}
        </p>
      </header>

      {/* ---- G1 IDENTITY CARD ---- */}
      <div className="idcard">
        <div className="idcard__brand">
          <G1Wordmark height={18} variant="white" />
          <span>DIGITAL IDENTITY</span>
        </div>

        <div className="idcard__body">
          <div className="idcard__avatar">
            {profile?.avatar_url
              ? <img src={avatarUrl(profile.avatar_url, 200)} alt="" />
              : <span>{(profile?.display_name || profile?.username || '?')[0].toUpperCase()}</span>}
          </div>
          <div className="idcard__meta">
            <p className="idcard__name">{profile?.display_name || profile?.username}</p>
            <p className="idcard__handle">@{profile?.username}</p>
            <div className="idcard__roles">
              {roleLabels.slice(0, 3).map((r) => (
                <span key={r.key} className="idcard__role">
                  {r.emoji} {r.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="idcard__actions">
          <button className="idcard__btn idcard__btn--ghost">Share ID</button>
          <button className="idcard__btn idcard__btn--solid">View Profile</button>
        </div>

        <p className="idcard__note">
          G1 digital identity — not government identification.
        </p>
      </div>

      {/* ---- YOUR G1 WORLD ---- */}
      <section className="home__section">
        <div className="home__section-head">
          <h2>Your G1 World</h2>
          <span className="home__section-link">View all →</span>
        </div>

        <div className="home__products">
          {G1_PRODUCTS.slice(0, 6).map((p) => (
            <button key={p.key} className="pcard" type="button">
              <span className="pcard__dot" style={{ background: p.accent }} />
              <span className="pcard__label">{p.label}</span>
              <span className="pcard__hint">Coming soon</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}