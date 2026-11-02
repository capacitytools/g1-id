import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Ebooks({ session }: { session: any }) {
  const nav = useNavigate();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('ebooks')
      .select('*')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setBooks(data || []);
        setLoading(false);
      });
  }, [session]);

  if (loading) return <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}><div className="g1-spinner" /></div>;

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">My Books</h1>
      </header>

      <p className="page__sub">Write, design, and publish directly to Amazon KDP.</p>

      <button 
        className="g1-btn g1-btn--solid g1-btn--full" 
        onClick={() => nav('/ebook/new')}
        style={{ marginBottom: 24 }}
      >
        + Start New Book
      </button>

      {books.length === 0 ? (
        <div className="empty">
          <div className="empty__icon">📚</div>
          <h3>No books yet</h3>
          <p>Start writing your first ebook using our AI co-writer and export it to Amazon format instantly.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {books.map((book) => (
            <div 
              key={book.id} 
              onClick={() => nav(`/ebook/${book.id}`)}
              style={{ background: 'var(--g1-surface)', padding: 16, borderRadius: 14, border: '1px solid var(--g1-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <div style={{ width: 48, height: 64, background: 'linear-gradient(135deg, var(--g1-primary-light), var(--g1-surface-2))', borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 24 }}>
                📖
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{book.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--g1-text-secondary)' }}>
                  {book.chapters?.length || 0} chapters · Updated {new Date(book.updated_at).toLocaleDateString()}
                </p>
              </div>
              <span style={{ fontSize: 20, color: 'var(--g1-text-secondary)' }}>›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}