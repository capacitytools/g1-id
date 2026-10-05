import { useEffect, useState } from 'react';

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('g1_install_dismissed') === '1');
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferred(null);
    }
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setDeferred(null);
  }

  function dismiss() {
    localStorage.setItem('g1_install_dismissed', '1');
    setDismissed(true);
  }

  if (!deferred || dismissed || installed) return null;

  return (
    <div className="install">
      <div className="install__icon">📲</div>
      <div className="install__meta">
        <strong>Install G1 ID</strong>
        <small>Faster, offline-ready, on your home screen</small>
      </div>
      <button className="install__btn" onClick={install}>Install</button>
      <button className="install__close" onClick={dismiss} aria-label="Dismiss">×</button>
    </div>
  );
}