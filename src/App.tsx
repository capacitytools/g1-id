import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { logLogin } from './lib/security';
import Landing from './pages/Landing';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Home from './pages/Home';
import Identity from './pages/Identity';
import Roles from './pages/Roles';
import Profile from './pages/Profile';
import Discover from './pages/Discover';
import G1Launcher from './pages/G1Launcher';
import Security from './pages/Security';
import Privacy from './pages/Privacy';
import PublicProfile from './pages/PublicProfile';
import OnboardingWizard from './features/onboarding/OnboardingWizard';
import G1Layout from './components/G1Layout';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'SIGNED_IN') logLogin();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="g1-spinner" />
      </div>
    );
  }

  function authed(el: JSX.Element) {
    return session ? el : <Navigate to="/signin" />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing session={session} />} />
      <Route path="/signup" element={session ? <Navigate to="/home" /> : <SignUp />} />
      <Route path="/signin" element={session ? <Navigate to="/home" /> : <SignIn />} />

      <Route path="/onboarding" element={session ? <OnboardingWizard session={session} /> : <Navigate to="/signin" />} />

      <Route path="/home" element={authed(<G1Layout><Home session={session} /></G1Layout>)} />
      <Route path="/identity" element={authed(<G1Layout><Identity session={session} /></G1Layout>)} />
      <Route path="/roles" element={authed(<G1Layout><Roles session={session} /></G1Layout>)} />
      <Route path="/profile" element={authed(<G1Layout><Profile session={session} /></G1Layout>)} />
      <Route path="/discover" element={authed(<G1Layout><Discover /></G1Layout>)} />
      <Route path="/g1" element={authed(<G1Layout><G1Launcher /></G1Layout>)} />
      <Route path="/security" element={authed(<G1Layout><Security session={session} /></G1Layout>)} />
      <Route path="/privacy" element={authed(<G1Layout><Privacy session={session} /></G1Layout>)} />

      {/* Public profile — must come last */}
      <Route path="/:handle" element={<PublicProfile />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
