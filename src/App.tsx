import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Landing from './pages/Landing';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Home from './pages/Home';
import OnboardingWizard from './features/onboarding/OnboardingWizard';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div className="g1-spinner" />
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<Landing session={session} />} />
      <Route path="/signup" element={session ? <Navigate to="/home" /> : <SignUp />} />
      <Route path="/signin" element={session ? <Navigate to="/home" /> : <SignIn />} />
      <Route
        path="/onboarding"
        element={session ? <OnboardingWizard session={session} /> : <Navigate to="/signin" />}
      />
      <Route
        path="/home"
        element={session ? <Home session={session} /> : <Navigate to="/signin" />}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}