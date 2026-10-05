import { Link } from 'react-router-dom';
import { G1Wordmark, G1Logo } from '../components/G1Logo';
import { G1_PRODUCTS } from '../lib/g1';

export default function Landing({ session }: { session: any }) {
  return (
    <div className="lp">
      {/* ===== Top nav ===== */}
      <header className="lp__nav">
        <div className="lp__nav-inner">
          <G1Wordmark height={30} />
          <div className="lp__nav-actions">
            {session ? (
              <Link to="/home" className="lp__nav-btn">Open G1 ID</Link>
            ) : (
              <>
                <Link to="/signin" className="lp__nav-link">Sign in</Link>
                <Link to="/signup" className="lp__nav-btn">Create G1 ID</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="lp__hero">
        <div className="lp__hero-inner">
          <span className="lp__pill">Part of the G1-Tech Ecosystem</span>

          <h1 className="lp__title">
            One ID.<br />
            Your entire <span>G1 world</span>.
          </h1>

          <p className="lp__subtitle">
            Create a single identity and use it across every G1 product —
            Chat, Mail, Market, Learn, Business, Wallet, and more.
            One username. One profile. One secure account.
          </p>

          <div className="lp__cta">
            {session ? (
              <Link to="/home" className="lp__btn lp__btn--solid">
                Open G1 ID
              </Link>
            ) : (
              <>
                <Link to="/signup" className="lp__btn lp__btn--solid">
                  Create your G1 ID
                </Link>
                <Link to="/signin" className="lp__btn lp__btn--ghost">
                  Sign in
                </Link>
              </>
            )}
          </div>

          <p className="lp__trust">
            Free to create · Takes 60 seconds · Built for Africa
          </p>
        </div>

        {/* Floating product preview card */}
        <div className="lp__preview">
          <div className="lp__idcard">
            <div className="lp__idcard-brand">
              <G1Wordmark height={18} variant="white" />
              <span>DIGITAL IDENTITY</span>
            </div>
            <div className="lp__idcard-body">
              <div className="lp__idcard-avatar">O</div>
              <div>
                <p className="lp__idcard-name">Olubunmi</p>
                <p className="lp__idcard-handle">@olubunmi</p>
                <div className="lp__idcard-roles">
                  <span>Creator</span>
                  <span>Business</span>
                </div>
              </div>
            </div>
            <p className="lp__idcard-note">
              G1 digital identity — not government identification.
            </p>
          </div>
        </div>
      </section>

      {/* ===== The problem ===== */}
      <section className="lp__section">
        <div className="lp__section-inner">
          <p className="lp__eyebrow">The problem</p>
          <h2 className="lp__h2">
            You shouldn't need 20 accounts for one digital life.
          </h2>
          <p className="lp__body">
            Every app wants its own login. A different username. A different
            password. A different profile you have to fill in from scratch.
            It's exhausting — and it fragments who you are online.
          </p>
        </div>
      </section>

      {/* ===== The solution ===== */}
      <section className="lp__section lp__section--tinted">
        <div className="lp__section-inner">
          <p className="lp__eyebrow">The G1 answer</p>
          <h2 className="lp__h2">
            Create one identity. Use it everywhere.
          </h2>
          <p className="lp__body">
            G1 ID is the identity layer of the G1-Tech Ecosystem. Sign in once,
            and your profile, roles, and preferences follow you across every
            G1 product — now and in the future.
          </p>

          <div className="lp__steps">
            <div className="lp__step">
              <div className="lp__step-num">1</div>
              <h3>Create G1 ID</h3>
              <p>One username, one password, one email or phone number.</p>
            </div>
            <div className="lp__step">
              <div className="lp__step-num">2</div>
              <h3>Build your identity</h3>
              <p>Add your roles, photo, bio. One profile, many sides.</p>
            </div>
            <div className="lp__step">
              <div className="lp__step-num">3</div>
              <h3>Access every G1 product</h3>
              <p>Chat, Mail, Market, Learn, Wallet, AI — all with one sign-in.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="lp__section">
        <div className="lp__section-inner">
          <p className="lp__eyebrow">What's inside</p>
          <h2 className="lp__h2">Built for how people actually live.</h2>

          <div className="lp__features">
            <div className="lp__feature">
              <div className="lp__feature-icon">🎯</div>
              <h3>Multiple roles, one identity</h3>
              <p>
                Creator, business owner, farmer, developer, expert — you don't
                need separate accounts. Switch between roles without logging out.
              </p>
            </div>

            <div className="lp__feature">
              <div className="lp__feature-icon">🔐</div>
              <h3>Security center built in</h3>
              <p>
                See every device, every login, every session. Detect suspicious
                activity instantly. Your account, fully transparent.
              </p>
            </div>

            <div className="lp__feature">
              <div className="lp__feature-icon">👁️</div>
              <h3>You control who sees what</h3>
              <p>
                Choose what's public, what only connections see, and what stays
                private. Your identity — your rules.
              </p>
            </div>

            <div className="lp__feature">
              <div className="lp__feature-icon">🎴</div>
              <h3>Your G1 ID card</h3>
              <p>
                A shareable digital identity with your own QR code. Send it,
                scan it, print it — your profile, one tap away.
              </p>
            </div>

            <div className="lp__feature">
              <div className="lp__feature-icon">✨</div>
              <h3>G1 AI by your side</h3>
              <p>
                Improve your bio, suggest the right roles, explain security
                alerts — a helpful assistant inside your identity.
              </p>
            </div>

            <div className="lp__feature">
              <div className="lp__feature-icon">⚡</div>
              <h3>Built for weak networks</h3>
              <p>
                Installs on your phone. Works offline. Loads fast on slow
                connections. Designed for African networks from day one.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Ecosystem ===== */}
      <section className="lp__section lp__section--tinted">
        <div className="lp__section-inner">
          <p className="lp__eyebrow">The G1 ecosystem</p>
          <h2 className="lp__h2">One ID unlocks a whole world.</h2>
          <p className="lp__body">
            G1 ID is the first product of the G1-Tech Ecosystem. Here's what's
            coming — all accessible with your single identity.
          </p>

          <div className="lp__eco-grid">
            {G1_PRODUCTS.map((p) => (
              <div key={p.key} className="lp__eco-card">
                <span className="lp__eco-dot" style={{ background: p.accent }} />
                <span className="lp__eco-label">{p.label}</span>
                <span className="lp__eco-soon">Soon</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Trust ===== */}
      <section className="lp__section">
        <div className="lp__section-inner lp__section-inner--narrow">
          <p className="lp__eyebrow">Trust & privacy</p>
          <h2 className="lp__h2">We take your identity seriously.</h2>

          <ul className="lp__trust-list">
            <li>
              <strong>Your data stays yours.</strong> We never sell it, share it,
              or use it to train third-party models.
            </li>
            <li>
              <strong>Bank-grade security.</strong> Encrypted in transit and at
              rest. Session tracking, device logs, and suspicious-activity alerts.
            </li>
            <li>
              <strong>Clearly not government ID.</strong> G1 ID is a private
              digital identity platform. It is not a government-issued document.
            </li>
            <li>
              <strong>You can leave anytime.</strong> Export your data or delete
              your account — no dark patterns, no hoops.
            </li>
          </ul>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="lp__section lp__section--tinted">
        <div className="lp__section-inner lp__section-inner--narrow">
          <p className="lp__eyebrow">Questions</p>
          <h2 className="lp__h2">Things people ask.</h2>

          <div className="lp__faq">
            <details className="lp__faq-item">
              <summary>Is G1 ID free?</summary>
              <p>
                Yes. Creating and using your G1 ID is completely free. Some future
                G1 products may have paid features, but your identity always stays free.
              </p>
            </details>

            <details className="lp__faq-item">
              <summary>Is this a government ID?</summary>
              <p>
                No. G1 ID is a private digital identity for the G1-Tech Ecosystem.
                It is not a government-issued identification document and is not
                a substitute for one.
              </p>
            </details>

            <details className="lp__faq-item">
              <summary>What can I do with it?</summary>
              <p>
                Today: create a shareable profile, use it across any G1 product you
                sign into, share your QR code, and manage your identity. As more
                G1 products launch, the same ID unlocks them all.
              </p>
            </details>

            <details className="lp__faq-item">
              <summary>Do you support phone numbers?</summary>
              <p>
                Email signup is live today. Phone-based signup with SMS is on the
                roadmap and will arrive soon — optimized for African networks.
              </p>
            </details>

            <details className="lp__faq-item">
              <summary>Can I delete my account?</summary>
              <p>
                Yes, anytime, from your account settings. Your data is deleted
                within 30 days and never sold or shared.
              </p>
            </details>

            <details className="lp__faq-item">
              <summary>Does it work offline?</summary>
              <p>
                Yes. G1 ID installs on your phone like an app and works on weak
                or intermittent connections. Data syncs when you're back online.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="lp__cta-final">
        <div className="lp__cta-final-inner">
          <G1Logo size={56} />
          <h2 className="lp__cta-title">
            Your identity, unified.
          </h2>
          <p className="lp__cta-sub">
            Create your G1 ID in under a minute. Free forever.
          </p>
          {session ? (
            <Link to="/home" className="lp__btn lp__btn--solid lp__btn--large">
              Open G1 ID
            </Link>
          ) : (
            <Link to="/signup" className="lp__btn lp__btn--solid lp__btn--large">
              Create your G1 ID
            </Link>
          )}
          <p className="lp__trust">
            No credit card · No spam · Cancel anytime
          </p>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="lp__footer">
        <div className="lp__footer-inner">
          <div className="lp__footer-brand">
            <G1Wordmark height={26} />
            <p className="lp__footer-tag">
              Part of the G1-Tech Ecosystem.<br />
              One ID. One Network. Many Possibilities.
            </p>
          </div>

          <div className="lp__footer-col">
            <h4>Product</h4>
            <Link to="/signup">Create G1 ID</Link>
            <Link to="/signin">Sign in</Link>
            <a href="#features">Features</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="lp__footer-col">
            <h4>Legal</h4>
            <a href="/legal/terms">Terms</a>
            <a href="/legal/privacy">Privacy</a>
            <a href="/legal/security">Security</a>
          </div>

          <div className="lp__footer-col">
            <h4>Contact</h4>
            <a href="mailto:hello@g1ecosystem.com">hello@g1ecosystem.com</a>
          </div>
        </div>

        <div className="lp__footer-bottom">
          <p>© {new Date().getFullYear()} G1-Tech Ecosystem. All rights reserved.</p>
          <p className="lp__footer-note">
            G1 ID is a digital identity platform — not government identification.
          </p>
        </div>
      </footer>
    </div>
  );
}