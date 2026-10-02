import { Link } from 'react-router-dom';
import { G1Wordmark } from '../components/G1Logo';

export default function Landing({ session }: { session: any }) {
  return (
    <div className="landing">
      <div className="landing__inner">
        <G1Wordmark height={34} />
        <div className="landing__hero">
          <h1 className="landing__tagline">
            One ID.<br />
            Your entire <span>G1 world</span>.
          </h1>
          <p className="landing__sub">
            Create your G1 ID once. Use it across every G1 product.
          </p>
          <div className="landing__actions">
            {session ? (
              <Link to="/home" className="g1-btn g1-btn--solid g1-btn--full">Continue to G1 ID</Link>
            ) : (
              <>
                <Link to="/signup" className="g1-btn g1-btn--solid g1-btn--full">Create G1 ID</Link>
                <Link to="/signin" className="g1-btn g1-btn--ghost g1-btn--full">Sign in</Link>
              </>
            )}
          </div>
          <p className="landing__legal">
            By continuing, you agree to G1's Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}