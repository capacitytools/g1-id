import { Link } from 'react-router-dom';
import { G1Wordmark } from '../components/G1Logo';

export default function PhoneAuth() {
  return (
    <div className="auth-shell">
      <div className="auth-shell__top">
        <G1Wordmark height={30} />
        <h1 className="auth-shell__title">Phone sign-in coming soon</h1>
        <p className="auth-shell__subtitle">
          We're setting up SMS verification for Nigerian numbers. In the
          meantime, please sign in with email.
        </p>
        <Link to="/signin" className="g1-btn g1-btn--solid g1-btn--full">
          Sign in with email
        </Link>
        <p className="auth-shell__footer">
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}