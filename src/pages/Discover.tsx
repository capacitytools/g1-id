export default function Discover() {
  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Discover G1</h1>
      </header>

      <p className="page__sub">
        Search across the entire G1 network — people, businesses, creators, courses, jobs, and more.
      </p>

      <div className="g1-field">
        <input placeholder="Search G1… (coming soon)" disabled />
      </div>

      <div className="empty">
        <div className="empty__icon">🔍</div>
        <h3>Search is coming</h3>
        <p>
          Soon you'll be able to find people, creators, businesses, courses, jobs and communities
          across the entire G1 ecosystem.
        </p>
      </div>
    </div>
  );
}