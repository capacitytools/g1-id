import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { G1Wordmark } from '../components/G1Logo';

export default function SignUp() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email.trim() || !password) return setError('Enter email and password.');
    if (password.length < 8) return setError('Password must be 8+ characters.');

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { emailRedirectTo: window.location.origin + '/home' }
    });
    setLoading(false);
    if (error) return setError(error.message);
    if (data.session) nav('/onboarding');
    else setSuccess('Check your email to confirm, then sign in.');
  }

  return (
    <div className="auth-shell">
      <div className="auth-shell__top">
        <G1Wordmark height={30} />
        <h1 className="auth-shell__title">Create your G1 ID</h1>
        <p className="auth-shell__subtitle">One ID for every G1 product.</p>
        {error && <div className="auth-alert auth-alert--error">{error}</div>}
        {success && <div className="auth-alert auth-alert--success">{success}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="g1-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="g1-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required />
          </div>
          <button type="submit" className="g1-btn g1-btn--solid g1-btn--full" disabled={loading}>{loading ? 'Creating...' : 'Create G1 ID'}</button>
        </form>
        <p className="auth-shell__footer">Already have a G1 ID? <Link to="/signin">Sign in</Link></p>
      </div>
    </div>
  );
}