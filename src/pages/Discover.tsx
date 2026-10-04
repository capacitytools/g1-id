import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchG1, SearchResult } from '../lib/search';
import { G1_ROLES, RoleKey } from '../lib/g1';
import { avatarUrl } from '../lib/cloudinary';

export default function Discover() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleKey | 'all'>('all');

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    const t = setTimeout(async () => {
      const r = await searchG1(q);
      setResults(r);
      setSearched(true);
      setLoading(false);
    }, 350);

    return () => clearTimeout(t);
  }, [query]);

  const visibleResults = useMemo(() => {
    if (roleFilter === 'all') return results;
    return results.filter((r) => r.roles.includes(roleFilter));
  }, [results, roleFilter]);

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Discover G1</h1>
      </header>

      <p className="page__sub">
        Search across the G1 network — people, roles, and locations.
      </p>

      <div className="search">
        <span className="search__icon" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>
        <input
          className="search__input"
          type="search"
          inputMode="search"
          autoCorrect="off"
          autoCapitalize="none"
          placeholder="Search G1..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            className="search__clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Role filter chips — only shown once we have results */}
      {searched && results.length > 0 && (
        <div className="chips">
          <button
            className={'chip' + (roleFilter === 'all' ? ' is-active' : '')}
            onClick={() => setRoleFilter('all')}
          >
            All
          </button>
          {G1_ROLES.filter((r) => results.some((x) => x.roles.includes(r.key))).map((r) => (
            <button
              key={r.key}
              className={'chip' + (roleFilter === r.key ? ' is-active' : '')}
              onClick={() => setRoleFilter(r.key)}
            >
              <span aria-hidden>{r.emoji}</span> {r.label}
            </button>
          ))}
        </div>
      )}

      {/* Empty state — nothing searched yet */}
      {!query && (
        <div className="empty">
          <div className="empty__icon">🔍</div>
          <h3>Search G1</h3>
          <p>
            Find people, roles, and locations across the G1 network.
            Try typing a name, a username, or a city.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="search__loading">
          <div className="g1-spinner" />
        </div>
      )}

      {/* No results */}
      {!loading && searched && visibleResults.length === 0 && (
        <div className="empty">
          <div className="empty__icon">🫥</div>
          <h3>No results</h3>
          <p>
            Nothing matched "{query}".
            Try a different spelling, or search for a role like "Creator".
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && visibleResults.length > 0 && (
        <div className="results">
          {visibleResults.map((r) => (
            <Link
              key={r.id}
              to={`/@${r.username}`}
              className="result"
            >
              <div className="result__avatar">
                {r.avatar_url ? (
                  <img src={avatarUrl(r.avatar_url, 120)} alt="" />
                ) : (
                  <span>{(r.display_name || r.username || '?')[0].toUpperCase()}</span>
                )}
              </div>
              <div className="result__meta">
                <p className="result__name">
                  {r.display_name || r.username}
                  {r.verified && <span className="result__verified">✓</span>}
                </p>
                <p className="result__handle">@{r.username}</p>
                {r.roles.length > 0 && (
                  <div className="result__roles">
                    {r.roles.slice(0, 3).map((role) => {
                      const info = G1_ROLES.find((x) => x.key === role);
                      return info ? (
                        <span key={role} className="result__role">
                          {info.emoji} {info.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              <span className="result__chev">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}