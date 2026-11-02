import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { askG1AI } from '../lib/ai';
import { generateEpub } from '../lib/epub';
import { uploadAvatar } from '../lib/cloudinary';
import BookCoverDesigner from '../components/BookCoverDesigner';

export default function EbookEditor({ session }: { session: any }) {
  const { id } = useParams();
  const nav = useNavigate();

  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<number | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showDesigner, setShowDesigner] = useState(false);

  // Load book
  useEffect(() => {
    async function load() {
      if (id === 'new') {
        const { data, error } = await supabase
          .from('ebooks')
          .insert({ user_id: session.user.id, title: 'Untitled Masterpiece' })
          .select()
          .single();
        
        if (data) {
          nav(`/ebook/${data.id}`, { replace: true });
        } else {
          setLoading(false);
        }
      } else {
        const { data } = await supabase
          .from('ebooks')
          .select('*')
          .eq('id', id)
          .single();
        
        if (data) {
          if (!Array.isArray(data.chapters)) data.chapters = [];
          setBook(data);
        }
        setLoading(false);
      }
    }
    load();
  }, [id, session, nav]);

  // Auto-save
  async function saveBook(updatedBook: any) {
    setBook(updatedBook);
    setSaving(true);
    await supabase
      .from('ebooks')
      .update({
        title: updatedBook.title,
        author: updatedBook.author,
        description: updatedBook.description,
        back_cover_text: updatedBook.back_cover_text,
        front_cover_url: updatedBook.front_cover_url,
        chapters: updatedBook.chapters,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedBook.id);
    setSaving(false);
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) return alert('Image must be under 5MB');

    setUploadingCover(true);
    try {
      const url = await uploadAvatar(file);
      saveBook({ ...book, front_cover_url: url });
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleDesignerSave(dataUrl: string) {
    setShowDesigner(false);
    setUploadingCover(true);
    try {
      // Convert Base64 to File
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
      
      const url = await uploadAvatar(file);
      saveBook({ ...book, front_cover_url: url });
    } catch (err: any) {
      alert('Could not save designed cover.');
    } finally {
      setUploadingCover(false);
    }
  }

  function addChapter() {
    const newChapters = [...book.chapters, { title: `Chapter ${book.chapters.length + 1}`, content: '' }];
    saveBook({ ...book, chapters: newChapters });
  }

  function updateChapter(index: number, field: string, value: string) {
    const newChapters = [...book.chapters];
    newChapters[index][field] = value;
    saveBook({ ...book, chapters: newChapters });
  }

  function removeChapter(index: number) {
    if (!confirm('Delete this chapter?')) return;
    const newChapters = book.chapters.filter((_: any, i: number) => i !== index);
    saveBook({ ...book, chapters: newChapters });
  }

  async function handleAiWrite(index: number) {
    setAiLoading(index);
    const currentContent = book.chapters[index].content;
    const title = book.chapters[index].title;

    const prompt = `You are writing a book. The book title is "${book.title}".
The current chapter is "${title}".
Here is what the author has written so far in this chapter: "${currentContent}"
Please write the NEXT paragraph or two to continue this chapter. Do not repeat what they wrote. Just output the new text.`;

    try {
      const result = await askG1AI({ messages: [{ role: 'user', text: prompt }], maxTokens: 400 });
      updateChapter(index, 'content', currentContent ? `${currentContent}\n\n${result}` : result);
    } catch (e) {
      alert('AI Error: Could not write.');
    } finally {
      setAiLoading(null);
    }
  }

  if (loading) return <div style={{ padding: 20 }}><div className="g1-spinner" /></div>;
  if (!book) return <div style={{ padding: 20 }}>Book not found.</div>;

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <header className="page__header" style={{ alignItems: 'center' }}>
        <Link to="/ebooks" className="g1-btn g1-btn--ghost" style={{ minHeight: 36, padding: '0 12px', fontSize: 13 }}>
          ← Back
        </Link>
        <span style={{ fontSize: 13, color: 'var(--g1-text-secondary)' }}>
          {saving ? 'Saving...' : 'Saved'}
        </span>
      </header>

      <div style={{ marginBottom: 24 }}>
        <button 
          className="g1-btn g1-btn--solid" 
          onClick={() => generateEpub(book)}
          style={{ width: '100%', background: '#FF9900', borderColor: '#FF9900', color: '#000', fontWeight: 800 }}
        >
          ⬇ Export EPUB (Amazon KDP Ready)
        </button>
      </div>

      {/* COVER SECTION */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Front Cover</label>
          <button 
            onClick={() => setShowDesigner(true)}
            className="g1-btn g1-btn--ghost" 
            style={{ minHeight: 32, padding: '0 10px', fontSize: 12 }}
          >
            ✨ Design 3D Cover
          </button>
        </div>
        
        <label 
          htmlFor="cover-upload" 
          style={{ 
            display: 'block', 
            width: '100%', 
            height: 240, 
            background: 'var(--g1-surface)', 
            border: '2px dashed var(--g1-border)', 
            borderRadius: 16, 
            overflow: 'hidden', 
            position: 'relative',
            cursor: 'pointer'
          }}
        >
          {book.front_cover_url ? (
            <img src={book.front_cover_url} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--g1-text-secondary)' }}>
              <span style={{ fontSize: 32, marginBottom: 8 }}>📸</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{uploadingCover ? 'Uploading...' : 'Upload Own Image'}</span>
              <span style={{ fontSize: 12, marginTop: 4 }}>or click "Design 3D Cover" above</span>
            </div>
          )}
        </label>
        <input 
          id="cover-upload" 
          type="file" 
          accept="image/*" 
          onChange={handleCoverUpload} 
          style={{ display: 'none' }} 
          disabled={uploadingCover}
        />
        {book.front_cover_url && (
          <button onClick={() => saveBook({ ...book, front_cover_url: null })} style={{ marginTop: 8, fontSize: 12, color: 'var(--g1-error)', background: 'none', border: 'none', textDecoration: 'underline' }}>
            Remove Cover
          </button>
        )}
      </div>

      {/* Book Metadata */}
      <div className="g1-field">
        <label>Book Title</label>
        <input 
          value={book.title} 
          onChange={(e) => saveBook({ ...book, title: e.target.value })} 
          style={{ fontSize: 20, fontWeight: 800 }}
        />
      </div>
      <div className="g1-field">
        <label>Author Name</label>
        <input 
          value={book.author || ''} 
          onChange={(e) => saveBook({ ...book, author: e.target.value })} 
        />
      </div>
      <div className="g1-field">
        <label>Description (Blurb)</label>
        <textarea 
          value={book.description || ''} 
          onChange={(e) => saveBook({ ...book, description: e.target.value })} 
          rows={3}
          className="g1-textarea"
        />
      </div>

      <hr style={{ margin: '30px 0', border: 'none', borderTop: '2px dashed var(--g1-border)' }} />

      {/* Chapters */}
      {book.chapters.map((ch: any, i: number) => (
        <div key={i} style={{ background: 'var(--g1-surface)', padding: 20, borderRadius: 16, border: '1px solid var(--g1-border)', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <input 
              value={ch.title} 
              onChange={(e) => updateChapter(i, 'title', e.target.value)}
              style={{ flex: 1, fontSize: 18, fontWeight: 700, border: 'none', background: 'transparent', outline: 'none', color: 'var(--g1-text)' }}
              placeholder="Chapter Title"
            />
            <button onClick={() => removeChapter(i)} style={{ color: 'var(--g1-error)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
          
          <textarea
            value={ch.content}
            onChange={(e) => updateChapter(i, 'content', e.target.value)}
            placeholder="Once upon a time..."
            className="g1-textarea"
            style={{ minHeight: 200, fontSize: 16, lineHeight: 1.6, border: 'none', background: '#F9F9F9' }}
          />
          
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => handleAiWrite(i)}
              disabled={aiLoading === i}
              className="g1-btn g1-btn--ghost"
              style={{ fontSize: 13, minHeight: 36 }}
            >
              {aiLoading === i ? '✨ Writing...' : '✨ Write next paragraph'}
            </button>
          </div>
        </div>
      ))}

      <button onClick={addChapter} className="g1-btn g1-btn--ghost g1-btn--full" style={{ marginBottom: 40 }}>
        + Add New Chapter
      </button>

      {/* Back Cover */}
      <div style={{ background: '#17211C', color: '#fff', padding: 24, borderRadius: 16 }}>
        <h3 style={{ margin: '0 0 16px', color: '#fff' }}>Back Cover</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
          This text will appear at the very end of the EPUB.
        </p>
        <textarea
          value={book.back_cover_text || ''}
          onChange={(e) => saveBook({ ...book, back_cover_text: e.target.value })}
          placeholder="About the author..."
          className="g1-textarea"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', minHeight: 120 }}
        />
      </div>

      {/* 3D Designer Modal */}
      {showDesigner && (
        <BookCoverDesigner
          initialTitle={book.title}
          initialAuthor={book.author || ''}
          onSave={handleDesignerSave}
          onClose={() => setShowDesigner(false)}
        />
      )}
    </div>
  );
}