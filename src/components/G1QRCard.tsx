import { QRCodeSVG } from 'qrcode.react';
import { useEffect } from 'react';
import { profileUrl, copyToClipboard, nativeShare } from '../lib/share';
import { G1Wordmark } from './G1Logo';

type Props = {
  open: boolean;
  onClose: () => void;
  username: string;
  displayName?: string;
  onToast: (msg: string) => void;
};

export default function G1QRCard({ open, onClose, username, displayName, onToast }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const url = profileUrl(username);

  async function handleCopy() {
    const ok = await copyToClipboard(url);
    onToast(ok ? 'Link copied to clipboard' : 'Could not copy — long-press to copy');
  }

  async function handleShare() {
    const shared = await nativeShare({
      title: `G1 ID — ${displayName || '@' + username}`,
      text: `Find me on G1: @${username}`,
      url,
    });
    if (!shared) handleCopy();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__handle" />

        <div className="qrcard">
          <div className="qrcard__brand">
            <G1Wordmark height={20} />
            <span>DIGITAL IDENTITY</span>
          </div>

          <div className="qrcard__qr">
            <QRCodeSVG
              value={url}
              size={200}
              bgColor="#FFFFFF"
              fgColor="#0B5D3B"
              level="M"
            />
          </div>

          <p className="qrcard__name">{displayName || username}</p>
          <p className="qrcard__handle">@{username}</p>
          <p className="qrcard__hint">Scan to view my G1 profile</p>
        </div>

        <div className="sheet__actions">
          <button className="g1-btn g1-btn--solid g1-btn--full" onClick={handleShare}>
            Share my G1
          </button>
          <button className="g1-btn g1-btn--ghost g1-btn--full" onClick={handleCopy}>
            Copy profile link
          </button>
          <button className="g1-btn g1-btn--ghost g1-btn--full" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="qrcard__note">
          G1 digital identity — not government identification.
        </p>
      </div>
    </div>
  );
}