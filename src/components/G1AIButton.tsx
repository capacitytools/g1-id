import { useState } from 'react';

type Props = {
  label: string;
  loadingLabel?: string;
  onRun: () => Promise<string>;
  onAccept?: (result: string) => void;
  acceptLabel?: string;
  compact?: boolean;
};

export default function G1AIButton({
  label,
  loadingLabel = 'Thinking…',
  onRun,
  onAccept,
  acceptLabel = 'Use this',
  compact = false,
}: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  async function run() {
    setState('loading');
    setResult('');
    setError('');
    try {
      const out = await onRun();
      setResult(out);
      setState('done');
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
      setState('error');
    }
  }

  return (
    <div className={'ai-btn' + (compact ? ' ai-btn--compact' : '')}>
      {state === 'idle' && (
        <button type="button" className="ai-btn__trigger" onClick={run}>
          <span className="ai-btn__spark" aria-hidden>✨</span>
          <span>{label}</span>
        </button>
      )}

      {state === 'loading' && (
        <div className="ai-btn__loading">
          <span className="ai-btn__spark" aria-hidden>✨</span>
          <span>{loadingLabel}</span>
        </div>
      )}

      {state === 'done' && (
        <div className="ai-btn__result">
          <p className="ai-btn__text">{result}</p>
          <div className="ai-btn__actions">
            {onAccept && (
              <button
                type="button"
                className="ai-btn__accept"
                onClick={() => {
                  onAccept(result);
                  setState('idle');
                  setResult('');
                }}
              >
                {acceptLabel}
              </button>
            )}
            <button
              type="button"
              className="ai-btn__retry"
              onClick={run}
            >
              Try again
            </button>
            <button
              type="button"
              className="ai-btn__dismiss"
              onClick={() => { setState('idle'); setResult(''); }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="ai-btn__result ai-btn__result--error">
          <p className="ai-btn__text">{error}</p>
          <div className="ai-btn__actions">
            <button type="button" className="ai-btn__retry" onClick={run}>Try again</button>
            <button type="button" className="ai-btn__dismiss" onClick={() => setState('idle')}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}