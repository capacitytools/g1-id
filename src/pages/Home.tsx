import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { G1Wordmark } from '../components/G1Logo';
import { G1_ROLES, G1_PRODUCTS, RoleKey } from '../lib/g1';
import { avatarUrl } from '../lib/cloudinary';
import G1QRCard from '../components/G1QRCard';

export default function Home({ session }: { session: any }) {
  const nav = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<RoleKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (p && !p.onboarding_complete) { nav('/onboarding', { replace: true }); return; }
      const { data: r } = await supabase.from('roles').select('role').eq('user_id', session.user.id);
      setProfile(p);
      setRoles((r || []).map((x: any) => x.role));
      setLoading(false);
    })();
  }, [session, nav]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }

  if (loading) return <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}><div className="g1-spinner" /></div>;

  const firstName = (profile?.display_name || '').split(' ')[0] || profile?.username;
  const roleLabels = G1_ROLES.filter((r) => roles.includes(r.key));

  return (
    <div className="home">
      <header className="home__greeting">
        <p className="home__hello">Welcome back,</p>
        <h1 className="home__name">{firstName}</h1>
        <p className="home__handle">
          @{profile?.username}
          {profile?.verified && <span className="home__verified">✓ Verified</span>}
        </p>
      </header>

      <div className="idcard">
        <div className="idcard__brand">
          <G1Wordmark height={18} variant="white" />
          <span>DIGITAL IDENTITY</span>
        </div>
        <div className="idcard__body">
          <div className="idcard__avatar">
            {profile?.avatar_url ? <img src={avatarUrl(profile.avatar_url, 200)} alt="" /> : <span>{(profile?.display_name || profile?.username || '?')[0].toUpperCase()}</span>}
          </div>
          <div className="idcard__meta">
            <p className="idcard__name">{profile?.display_name || profile?.username}</p>
            <p className="idcard__handle">@{profile?.username}</p>
            <div className="idcard__roles">
              {roleLabels.slice(0, 3).map((r) => <span key={r.key} className="idcard__role">{r.emoji} {r.label}</span>)}
            </div>
          </div>
        </div>
        <div className="idcard__actions">
          <button className="idcard__btn idcard__btn--ghost" onClick={() => setQrOpen(true)}>Share ID</button>
          <button className="idcard__btn idcard__btn--solid" onClick={() => nav('/identity')}>View Profile</button>
        </div>
        <p className="idcard__note">G1 digital identity — not government identification.</p>
      </div>

      {/* AUTOPILOT QUICK LINK */}
      <a 
        href="https://g1-autopilot-ai.vercel.app/studio" 
        target="_blank" 
        rel="noopener noreferrer" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: '#F0FBF5', 
          padding: '16px 20px', 
          borderRadius: 16, 
          marginBottom: 28, 
          textDecoration: 'none', 
          color: 'var(--g1-primary-dark)', 
          border: '1px solid #C7E5D5' 
        }}
      >
        <span style={{ fontSize: 24, marginRight: 16 }}>🚀</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800 }}>Content Plan Studio</h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--g1-primary)' }}>Generate SEO ideas with Autopilot AI</p>
        </div>
        <span style={{ fontSize: 20 }}>↗</span>
      </a>

      <section className="home__section">
        <div className="home__section-head">
          <h2>Your G1 World</h2>
          <button className="home__section-link" onClick={() => nav('/g1')}>View all →</button>
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

      <G1QRCard open={qrOpen} onClose={() => setQrOpen(false)} username={profile?.username} displayName={profile?.display_name} onToast={showToast} />
      {toast && <div className="g1-toast">{toast}</div>}
    </div>
  );
}