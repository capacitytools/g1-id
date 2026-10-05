import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { downloadMyData, deleteMyAccount } from '../lib/account';

export default function Profile({ session }: { session: any }) {
  const nav = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

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

  async function handleDownload() {
    setBusy('download');
    setError('');
    try {
      await downloadMyData(session.user.id);
    } catch (e: any) {
      setError(e.message || 'Could not export data.');
    } finally {
      setBusy('');
    }
  }

  async function handleDelete() {
    setBusy('delete');
    setError('');

    const confirmation = prompt(
      'This will permanently delete your G1 ID and all your data.\n\nType DELETE (in capitals) to confirm:'
    );
    if (confirmation === null) {
      setBusy('');
      return;
    }

    const result = await deleteMyAccount(session.user.id, confirmation);
    setBusy('');
    if (!result.ok) {
      setError(result.error || 'Could not delete account.');
      return;
    }

    alert('Your G1 ID has been deleted.');
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
          <span>Security Center</span><span className="menu__chev">›</span>
        </Link>
        <Link to="/privacy" className="menu__item">
          <span>Privacy</span><span className="menu__chev">›</span>
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

      <div className="menu">
        <button
          className="menu__item"
          onClick={handleDownload}
          disabled={busy === 'download'}
          style={{ width: '100%', textAlign: 'left' }}
        >
          <span>{busy === 'download' ? 'Preparing…' : 'Download my data'}</span>
          <span className="menu__chev">↓</span>
        </button>
      </div>

      {error && <div className="auth-alert auth-alert--error">{error}</div>}

      <button
        className="g1-btn g1-btn--ghost g1-btn--full"
        style={{ marginTop: 24 }}
        onClick={signOut}
      >
        Sign out
      </button>

      <div className="danger-zone">
        <h3 className="danger-zone__title">Danger zone</h3>
        <p className="danger-zone__text">
          Deleting your G1 ID removes your profile, roles, devices, and connected
          products. This cannot be undone.
        </p>
        <button
          className="g1-btn g1-btn--full danger-zone__btn"
          onClick={handleDelete}
          disabled={busy === 'delete'}
        >
          {busy === 'delete' ? 'Deleting…' : 'Delete my account'}
        </button>
      </div>
    </div>
  );
}