import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { uploadAvatar, avatarUrl } from '../../lib/cloudinary';
import { G1_ROLES, RoleKey, validateUsername } from '../../lib/g1';
import { G1Wordmark } from '../../components/G1Logo';

type Step = 'welcome' | 'name' | 'username' | 'photo' | 'roles' | 'done';

export default function OnboardingWizard({ session }: { session: any }) {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('welcome');

  // Collected data
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [roles, setRoles] = useState<RoleKey[]>(['personal']);

  // Load existing profile once
  useEffect(() => {
    supabase
      .from('profiles')
      .select('display_name, username, avatar_url, onboarding_complete')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data?.onboarding_complete) {
          nav('/home', { replace: true });
          return;
        }
        if (data?.display_name) setDisplayName(data.display_name);
        if (data?.avatar_url)   setAvatarUrl(data.avatar_url);
        // Start username blank so user picks their own (trigger set a placeholder)
        if (data?.username && !data.username.startsWith('user_')) {
          setUsername(data.username);
        }
      });
  }, [session, nav]);

  async function finish() {
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        username: username.trim().toLowerCase(),
        avatar_url: avatarUrl || null,
        onboarding_complete: true,
        completion: computeCompletion(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id);

    if (error) {
      alert('Could not save profile: ' + error.message);
      return;
    }

    // Insert roles (upsert to be safe)
    await supabase.from('roles').upsert(
      roles.map((r) => ({ user_id: session.user.id, role: r, is_primary: r === roles[0] })),
      { onConflict: 'user_id,role' }
    );

    nav('/home', { replace: true });
  }

  function computeCompletion() {
    let pct = 30; // name + username + email
    if (avatarUrl) pct += 20;
    if (roles.length > 1) pct += 15;
    pct += 20; // roles added
    pct += 15; // account secured by default
    return Math.min(pct, 100);
  }

  return (
    <div className="onb">
      <div className="onb__progress">
        {(['welcome','name','username','photo','roles','done'] as Step[]).map((s) => (
          <div key={s} className={'onb__dot' + (s === step ? ' is-active' : '')} />
        ))}
      </div>

      <div className="onb__body">
        {step === 'welcome' && (
          <WelcomeStep onNext={() => setStep('name')} />
        )}

        {step === 'name' && (
          <NameStep
            value={displayName}
            onChange={setDisplayName}
            onBack={() => setStep('welcome')}
            onNext={() => setStep('username')}
          />
        )}

        {step === 'username' && (
          <UsernameStep
            value={username}
            onChange={setUsername}
            onBack={() => setStep('name')}
            onNext={() => setStep('photo')}
            userId={session.user.id}
          />
        )}

        {step === 'photo' && (
          <PhotoStep
            avatarUrl={avatarUrl}
            onChange={setAvatarUrl}
            onBack={() => setStep('username')}
            onNext={() => setStep('roles')}
            userId={session.user.id}
          />
        )}

        {step === 'roles' && (
          <RolesStep
            roles={roles}
            onChange={setRoles}
            onBack={() => setStep('photo')}
            onNext={() => setStep('done')}
          />
        )}

        {step === 'done' && (
          <DoneStep
            displayName={displayName}
            username={username}
            roles={roles}
            onFinish={finish}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- Step 1: Welcome ---------- */
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <>
      <div className="onb__hero">
        <G1Wordmark height={36} />
        <h1 className="onb__title">Build your G1 identity</h1>
        <p className="onb__sub">
          One ID. One identity. Many G1 products.
          This takes about 60 seconds.
        </p>
      </div>
      <div className="onb__actions">
        <button className="g1-btn g1-btn--solid g1-btn--full" onClick={onNext}>
          Let's begin
        </button>
      </div>
    </>
  );
}

/* ---------- Step 2: Name ---------- */
function NameStep({
  value, onChange, onNext, onBack,
}: {
  value: string; onChange: (v: string) => void;
  onNext: () => void; onBack: () => void;
}) {
  const [error, setError] = useState('');
  function next() {
    const v = value.trim();
    if (v.length < 2) return setError('Please enter at least 2 characters');
    setError('');
    onNext();
  }
  return (
    <>
      <h1 className="onb__title">What should we call you?</h1>
      <p className="onb__sub">This is your display name across G1.</p>

      <div className="g1-field">
        <label htmlFor="dn">Display name</label>
        <input
          id="dn"
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Olubunmi"
          onKeyDown={(e) => e.key === 'Enter' && next()}
        />
        {error && <span className="g1-field__error">{error}</span>}
      </div>

      <div className="onb__actions">
        <button className="g1-btn g1-btn--ghost" onClick={onBack}>Back</button>
        <button className="g1-btn g1-btn--solid" onClick={next}>Continue</button>
      </div>
    </>
  );
}

/* ---------- Step 3: Username ---------- */
function UsernameStep({
  value, onChange, onNext, onBack, userId,
}: {
  value: string; onChange: (v: string) => void;
  onNext: () => void; onBack: () => void; userId: string;
}) {
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  // Debounced availability check
  useEffect(() => {
    const v = value.trim().toLowerCase();
    if (!v) { setAvailable(null); setError(''); return; }
    const localErr = validateUsername(v);
    if (localErr) { setError(localErr); setAvailable(null); return; }
    setError('');

    const t = setTimeout(async () => {
      setChecking(true);
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', v)
        .maybeSingle();
      setChecking(false);
      // Available if no row, OR the row is this user
      setAvailable(!data || data.id === userId);
    }, 400);
    return () => clearTimeout(t);
  }, [value, userId]);

  function next() {
    if (!available) return;
    onNext();
  }

  return (
    <>
      <h1 className="onb__title">Choose your @username</h1>
      <p className="onb__sub">This is your permanent G1 handle. Pick carefully.</p>

      <div className="g1-field">
        <label htmlFor="un">Username</label>
        <div className="onb__input-prefix">
          <span>@</span>
          <input
            id="un"
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={value}
            onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="yourname"
            onKeyDown={(e) => e.key === 'Enter' && next()}
          />
        </div>
        {error && <span className="g1-field__error">{error}</span>}
        {!error && checking && <span className="g1-field__hint">Checking…</span>}
        {!error && !checking && available === true && (
          <span className="g1-field__hint" style={{ color: 'var(--g1-success)' }}>
            ✓ @{value} is available
          </span>
        )}
        {!error && !checking && available === false && (
          <span className="g1-field__error">@{value} is taken</span>
        )}
        {!error && !checking && available === null && value && (
          <span className="g1-field__hint">g1ecosystem.com/@{value}</span>
        )}
      </div>

      <div className="onb__actions">
        <button className="g1-btn g1-btn--ghost" onClick={onBack}>Back</button>
        <button
          className="g1-btn g1-btn--solid"
          onClick={next}
          disabled={!available}
        >
          Continue
        </button>
      </div>
    </>
  );
}

/* ---------- Step 4: Photo ---------- */
function PhotoStep({
  avatarUrl, onChange, onNext, onBack,
}: {
  avatarUrl: string; onChange: (v: string) => void;
  onNext: () => void; onBack: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB');
      return;
    }
    setError('');
    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadAvatar(file, setProgress);
      onChange(url);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <h1 className="onb__title">Add a profile photo</h1>
      <p className="onb__sub">A photo helps people recognize you across G1. You can skip this.</p>

      <div className="onb__avatar-wrap">
        <label className="onb__avatar" htmlFor="avatar-input">
          {avatarUrl ? (
            <img src={avatarUrl(avatarUrl, 200)} alt="" />
          ) : (
            <span className="onb__avatar-placeholder">+</span>
          )}
          <input
            id="avatar-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
        </label>

        {uploading && (
          <div className="onb__upload">
            <div className="onb__upload-bar">
              <div style={{ width: `${progress}%` }} />
            </div>
            <span className="g1-field__hint">Uploading… {progress}%</span>
          </div>
        )}
        {error && <span className="g1-field__error">{error}</span>}
      </div>

      <div className="onb__actions">
        <button className="g1-btn g1-btn--ghost" onClick={onBack}>Back</button>
        <button className="g1-btn g1-btn--solid" onClick={onNext} disabled={uploading}>
          {avatarUrl ? 'Continue' : 'Skip for now'}
        </button>
      </div>
    </>
  );
}

/* ---------- Step 5: Roles ---------- */
function RolesStep({
  roles, onChange, onNext, onBack,
}: {
  roles: RoleKey[]; onChange: (r: RoleKey[]) => void;
  onNext: () => void; onBack: () => void;
}) {
  function toggle(key: RoleKey) {
    if (key === 'personal') return; // personal is always on
    onChange(
      roles.includes(key)
        ? roles.filter((r) => r !== key)
        : [...roles, key]
    );
  }

  return (
    <>
      <h1 className="onb__title">What describes you?</h1>
      <p className="onb__sub">Pick as many as apply. You can change this anytime.</p>

      <div className="onb__roles">
        {G1_ROLES.map((r) => {
          const on = roles.includes(r.key);
          const locked = r.key === 'personal';
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => toggle(r.key)}
              className={'onb__role' + (on ? ' is-on' : '') + (locked ? ' is-locked' : '')}
              aria-pressed={on}
            >
              <span className="onb__role-emoji">{r.emoji}</span>
              <span className="onb__role-meta">
                <strong>{r.label}</strong>
                <small>{r.desc}</small>
              </span>
              <span className="onb__role-check" aria-hidden>
                {on ? '✓' : ''}
              </span>
            </button>
          );
        })}
      </div>

      <div className="onb__actions">
        <button className="g1-btn g1-btn--ghost" onClick={onBack}>Back</button>
        <button className="g1-btn g1-btn--solid" onClick={onNext}>
          Continue
        </button>
      </div>
    </>
  );
}

/* ---------- Step 6: Done ---------- */
function DoneStep({
  displayName, username, roles, onFinish,
}: {
  displayName: string; username: string; roles: RoleKey[]; onFinish: () => void;
}) {
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    await onFinish();
  }
  return (
    <>
      <div className="onb__hero">
        <div className="onb__success">✓</div>
        <h1 className="onb__title">You're all set{displayName ? ', ' + displayName.split(' ')[0] : ''}!</h1>
        <p className="onb__sub">
          Your G1 ID is ready. Here's what you can access:
        </p>
      </div>

      <div className="onb__summary">
        <div className="onb__summary-row">
          <span>Username</span><strong>@{username}</strong>
        </div>
        <div className="onb__summary-row">
          <span>Roles</span><strong>{roles.length}</strong>
        </div>
        <div className="onb__summary-row">
          <span>Products ready</span><strong>13+</strong>
        </div>
      </div>

      <div className="onb__actions">
        <button
          className="g1-btn g1-btn--solid g1-btn--full"
          onClick={save}
          disabled={saving}
        >
          {saving ? 'Opening your G1…' : 'Enter G1 World'}
        </button>
      </div>
    </>
  );
}