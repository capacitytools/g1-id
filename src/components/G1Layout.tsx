import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import G1BottomNav from './G1BottomNav';
import InstallPrompt from './InstallPrompt';
import { supabase } from '../lib/supabase';
import { unreadCount } from '../lib/notifications';

export default function G1Layout({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const n = await unreadCount(user.id);
      setCount(n);
    })();

    const ch = supabase
      .channel('layout-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const n = await unreadCount(user.id);
        setCount(n);
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="glayout">
      <main className="glayout__main">{children}</main>
      <Link to="/notifications" className="glayout__bell" aria-label="Notifications">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {count > 0 && (
          <span className="glayout__bell-badge">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </Link>
      <InstallPrompt />
      <G1BottomNav />
    </div>
  );
}