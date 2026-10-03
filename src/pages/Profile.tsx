import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Profile({ session }: { session: any }) {
  const nav = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  async function signOut() {
    if (!confirm('Sign out of G1 ID?')) return;
    await supabase.auth.signOut();
    nav('/', { replace: true });
  }

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Account</h1>
      </header>

      <div className="menu">
        <Link to="/identity" className="menu__item">
          <span>My Identity</span><span className="menu__chev">›</span>
        </Link>
        <Link to="/roles" className="menu__item">
          <span>My Roles</span><span className="menu__chev">›</span>
        </Link>
        <Link to="/security" className="menu__item">
          <span>Security Center</span><span className="menu__badge">Soon</span>
        </Link>
        <Link to="/privacy" className="menu__item">
          <span>Privacy</span><span className="menu__badge">Soon</span>
        </Link>
      </div>

      <div className="menu">
        <div className="menu__item" style={{ cursor: 'default' }}>
          <span>Email</span>
          <span className="menu__meta">{session.user.email}</span>
        </div>
        <div className="menu__item" style={{ cursor: 'default' }}>
          <span>Username</span>
          <span className="menu__meta">@{profile?.username}</span>
        </div>
      </div>

      <button
        className="g1-btn g1-btn--ghost g1-btn--full"
        style={{ marginTop: 24, color: 'var(--g1-error)', borderColor: '#F5C6C6' }}
        onClick={signOut}
      >
        Sign out
      </button>
    </div>
  );
}