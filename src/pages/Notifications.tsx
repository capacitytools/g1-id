import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  fetchNotifications,
  markRead,
  markAllRead,
  groupByDay,
  timeAgo,
  Notification,
} from '../lib/notifications';

export default function Notifications({ session }: { session: any }) {
  const nav = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  async function load() {
    const data = await fetchNotifications(session.user.id);
    setItems(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [session]);

  // Real-time subscription
  useEffect(() => {
    const ch = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          setItems((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [session]);

  async function handleOpen(n: Notification) {
    if (!n.read_at) {
      await markRead(session.user.id, n.id);
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
      );
    }
    if (n.link) nav(n.link);
  }

  async function handleMarkAll() {
    await markAllRead(session.user.id);
    setItems((prev) =>
      prev.map((x) => (x.read_at ? x : { ...x, read_at: new Date().toISOString() }))
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <div className="g1-spinner" />
      </div>
    );
  }

  const visible = filter === 'unread' ? items.filter((x) => !x.read_at) : items;
  const grouped = groupByDay(visible);
  const unread = items.filter((x) => !x.read_at).length;

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Notifications</h1>
        {unread > 0 && (
          <button className="page__action" onClick={handleMarkAll}>
            Mark all read
          </button>
        )}
      </header>

      <div className="nfil">
        <button
          className={'nfil__tab' + (filter === 'all' ? ' is-active' : '')}
          onClick={() => setFilter('all')}
        >
          All ({items.length})
        </button>
        <button
          className={'nfil__tab' + (filter === 'unread' ? ' is-active' : '')}
          onClick={() => setFilter('unread')}
        >
          Unread ({unread})
        </button>
      </div>

      {items.length === 0 && (
        <div className="empty">
          <div className="empty__icon">🔔</div>
          <h3>No notifications yet</h3>
          <p>
            You'll see updates here when something happens on your G1 ID —
            new sign-ins, role changes, and more.
          </p>
        </div>
      )}

      {filter === 'unread' && visible.length === 0 && items.length > 0 && (
        <div className="empty">
          <div className="empty__icon">✅</div>
          <h3>All caught up</h3>
          <p>You've read every notification.</p>
        </div>
      )}

      {grouped.map((group) => (
        <section key={group.label} className="ngroup">
          <h2 className="ngroup__title">{group.label}</h2>
          <div className="nlist">
            {group.items.map((n) => (
              <button
                key={n.id}
                className={'ncard' + (n.read_at ? '' : ' is-unread')}
                onClick={() => handleOpen(n)}
              >
                <span className="ncard__icon" aria-hidden>
                  {n.icon || '•'}
                </span>
                <span className="ncard__body">
                  <span className="ncard__title">{n.title}</span>
                  {n.body && <span className="ncard__text">{n.body}</span>}
                  <span className="ncard__time">{timeAgo(n.created_at)}</span>
                </span>
                {!n.read_at && <span className="ncard__dot" aria-label="Unread" />}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}