import { G1_PRODUCTS } from '../lib/g1';

export default function G1Launcher() {
  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Your G1 World</h1>
      </header>

      <p className="page__sub">
        All G1 products connected to your identity. Products marked "Soon" will appear here as they launch.
      </p>

      <div className="launcher">
        {G1_PRODUCTS.map((p) => (
          <button key={p.key} className="launcher__card" type="button">
            <span className="launcher__dot" style={{ background: p.accent }} />
            <span className="launcher__label">{p.label}</span>
            <span className="launcher__hint">Soon</span>
          </button>
        ))}
      </div>
    </div>
  );
}