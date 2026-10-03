import { NavLink } from 'react-router-dom';
import { G1Logo } from './G1Logo';

const TABS = [
  { to: '/home',      label: 'Home',     icon: HomeIcon },
  { to: '/identity',  label: 'Identity', icon: IdentityIcon },
  { to: '/discover',  label: 'Discover', icon: DiscoverIcon },
  { to: '/g1',        label: 'G1',       icon: G1Icon, isCentral: true },
  { to: '/profile',   label: 'Profile',  icon: ProfileIcon },
];

export default function G1BottomNav() {
  return (
    <nav className="bnav" aria-label="Primary navigation">
      {TABS.map((t) => {
        const Icon = t.icon;
        return (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              'bnav__tab' + (isActive ? ' is-active' : '') + (t.isCentral ? ' is-central' : '')
            }
          >
            <span className="bnav__icon">
              {t.isCentral ? <G1Logo size={26} /> : <Icon />}
            </span>
            <span className="bnav__label">{t.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function IdentityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="10" r="2" />
      <path d="M5 17c1-2 3-3 4-3s3 1 4 3" />
      <path d="M15 10h4M15 14h4" />
    </svg>
  );
}

function DiscoverIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-2 6-6 2 2-6z" />
    </svg>
  );
}

function G1Icon() {
  return <G1Logo size={22} />;
}

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}