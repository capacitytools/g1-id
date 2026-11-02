import { NavLink } from 'react-router-dom';
import { G1Logo } from './G1Logo';

const TABS = [
  { to: '/home',      label: 'Home',     icon: HomeIcon },
  { to: '/identity',  label: 'Identity', icon: IdentityIcon },
  { to: '/ebooks',    label: 'Books',    icon: BookIcon },
  { to: '/g1',        label: 'G1',       icon: G1Icon, isCentral: true },
  // NEW: External link to G1-Autopilot
  { to: 'https://g1-autopilot-ai.vercel.app/studio', label: 'Plan', icon: PlanIcon, isExternal: true },
  { to: '/profile',   label: 'Profile',  icon: ProfileIcon },
];

export default function G1BottomNav() {
  return (
    <nav className="bnav" aria-label="Primary navigation">
      {TABS.map((t) => {
        const Icon = t.icon;
        
        // Handle external links separately
        if (t.isExternal) {
          return (
            <a
              key={t.to}
              href={t.to}
              className="bnav__tab"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="bnav__icon"><Icon /></span>
              <span className="bnav__label">{t.label}</span>
            </a>
          );
        }

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

function HomeIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>; }
function IdentityIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="M5 17c1-2 3-3 4-3s3 1 4 3" /><path d="M15 10h4M15 14h4" /></svg>; }
function BookIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>; }
function G1Icon() { return <G1Logo size={22} />; }
function ProfileIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" /></svg>; }

// NEW: Icon for Content Plan (A clipboard/task list look)
function PlanIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}