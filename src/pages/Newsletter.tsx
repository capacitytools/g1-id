import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Newsletter({ session }: { session: any }) {
  const [emailsText, setEmailsText] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState(session.user.email || '');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    // Very basic CSV parse: assume emails are separated by commas or newlines
    const extractedEmails = text
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.includes('@'))
      .join('\n');

    setEmailsText((prev) => prev ? `${prev}\n${extractedEmails}` : extractedEmails);
  }

  async function handleSend() {
    setSuccess(''); setError('');

    if (!subject || !content || !emailsText) {
      return setError('Please fill in all fields and add at least one email.');
    }

    if (!replyTo.includes('@')) {
      return setError('Please provide a valid Reply-To email address.');
    }

    setSending(true);

    try {
      const emailsArray = emailsText.split('\n');
      
      const res = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          content,
          replyTo,
          emails: emailsArray,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send.');

      // Save to history
      await supabase.from('newsletters').insert({
        user_id: session.user.id,
        subject,
        content,
        reply_to: replyTo,
        recipients_count: data.count,
      });

      setSuccess(`Successfully sent to ${data.count} recipients!`);
      setSubject('');
      setContent('');
      setEmailsText('');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Newsletter</h1>
      </header>

      <p className="page__sub">Send an email blast to your customers, students, or subscribers.</p>

      {success && <div className="auth-alert auth-alert--success">{success}</div>}
      {error && <div className="auth-alert auth-alert--error">{error}</div>}

      <div style={{ background: 'var(--g1-surface)', padding: 20, borderRadius: 16, border: '1px solid var(--g1-border)', marginBottom: 20 }}>
        
        <div className="g1-field">
          <label>Reply-To Email (Your Gmail)</label>
          <input 
            type="email" 
            value={replyTo} 
            onChange={(e) => setReplyTo(e.target.value)} 
            placeholder="you@gmail.com" 
          />
          <span className="g1-field__hint">When recipients click "Reply", it goes here.</span>
        </div>

        <div className="g1-field">
          <label>Subject Line</label>
          <input 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)} 
            placeholder="e.g. My new book is out!" 
          />
        </div>

        <div className="g1-field">
          <label>Message (Article)</label>
          <textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            placeholder="Write your message here..."
            className="g1-textarea"
            rows={6}
          />
        </div>

        <div className="g1-field" style={{ marginTop: 24, borderTop: '1px solid var(--g1-border)', paddingTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label>Recipients</label>
            <label className="g1-btn g1-btn--ghost" style={{ minHeight: 32, padding: '0 12px', fontSize: 12, cursor: 'pointer' }}>
              Upload CSV
              <input type="file" accept=".csv,.txt" onChange={handleCsvUpload} style={{ display: 'none' }} />
            </label>
          </div>
          <textarea 
            value={emailsText} 
            onChange={(e) => setEmailsText(e.target.value)} 
            placeholder="Paste emails here, one per line:\ncustomer1@gmail.com\ncustomer2@yahoo.com"
            className="g1-textarea"
            rows={4}
            style={{ fontSize: 13 }}
          />
          <span className="g1-field__hint">
            {emailsText.split('\n').filter((e) => e.includes('@')).length} valid emails detected.
          </span>
        </div>

        <button 
          className="g1-btn g1-btn--solid g1-btn--full" 
          style={{ marginTop: 16 }}
          onClick={handleSend}
          disabled={sending}
        >
          {sending ? 'Sending...' : 'Send Newsletter'}
        </button>
      </div>
    </div>
  );
}