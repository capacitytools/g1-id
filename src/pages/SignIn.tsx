import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { G1Wordmark } from '../components/G1Logo';
import G1PasswordInput from '../components/G1PasswordInput';

export default function SignIn() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError('');
    if (!email.trim() || !password) return setError('Enter email and password.');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) return setError(error.message);
    nav('/home');
  }

  return (
    <div className="auth-shell">
      <div className="auth-shell__top">
        <G1Wordmark height={30} />
        <h1 className="auth-shell__title">Welcome back</h1>
        <p className="auth-shell__subtitle">Sign in to your G1 ID.</p>

        {error && <div className="auth-alert auth-alert--error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="g1-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <G1PasswordInput
            value={password}
            onChange={setPassword}
            label="Password"
            placeholder="Your password"
            autoComplete="current-password"
            onEnter={() => handleSubmit()}
          />

          <button
            type="submit"
            className="g1-btn g1-btn--solid g1-btn--full"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <Link
          to="/phone"
          className="g1-btn g1-btn--ghost g1-btn--full"
          style={{ marginBottom: 8 }}
        >
          📱 Continue with phone (soon)
        </Link>

        <p className="auth-shell__footer">
          New to G1? <Link to="/signup">Create G1 ID</Link>
        </p>
      </div>
    </div>
  );
}