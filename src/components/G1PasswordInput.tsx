import { useState } from 'react';
import { checkPassword } from '../lib/password';

type Props = {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  autoComplete?: string;
  showStrength?: boolean;
  onEnter?: () => void;
  autoFocus?: boolean;
};

export default function G1PasswordInput({
  id = 'password',
  value,
  onChange,
  label = 'Password',
  placeholder = 'At least 8 characters',
  autoComplete = 'current-password',
  showStrength = false,
  onEnter,
  autoFocus = false,
}: Props) {
  const [visible, setVisible] = useState(false);
  const strength = checkPassword(value);

  return (
    <div className="g1-field">
      <label htmlFor={id}>{label}</label>

      <div className="pw-input">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onEnter) onEnter();
          }}
        />

        <button
          type="button"
          className="pw-input__eye"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? (
            /* Eye-off icon */
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            /* Eye icon */
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      {showStrength && value && (
        <>
          <div className="pw-meter">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={
                  'pw-meter__seg' +
                  (i <= strength.score ? ` is-${strength.score}` : '')
                }
              />
            ))}
          </div>
          <div className="pw-meter__label">
            <strong>{strength.label}</strong>
          </div>
          {strength.hints.length > 0 && (
            <p className="pw-meter__hint">{strength.hints[0]}</p>
          )}
        </>
      )}
    </div>
  );
}