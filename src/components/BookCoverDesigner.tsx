import { useRef, useState } from 'react';

export default function BookCoverDesigner({
  initialTitle,
  initialAuthor,
  onSave,
  onClose,
}: {
  initialTitle: string;
  initialAuthor: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [author, setAuthor] = useState(initialAuthor);
  const [bgColor, setBgColor] = useState('#0B5D3B');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontStyle, setFontStyle] = useState<'sans' | 'serif'>('serif');
  
  const bookRef = useRef<HTMLDivElement>(null);

  // Converts the 3D design into a flat 2D image for the EPUB
  const handleSaveImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 2560;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Add a subtle gradient to simulate a spine shadow
    const gradient = ctx.createLinearGradient(0, 0, 200, 0);
    gradient.addColorStop(0, 'rgba(0,0,0,0.3)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 200, canvas.height);

    // 3. Text setup
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const fontName = fontStyle === 'serif' ? 'Georgia, serif' : 'Inter, sans-serif';
    
    // Title
    ctx.font = `bold 120px ${fontName}`;
    const maxWidth = canvas.width - 400;
    const words = title.split(' ');
    let line = '';
    let y = canvas.height / 2 - 200;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n] + ' ';
        y += 140;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);

    // Author
    ctx.font = `600 70px ${fontName}`;
    ctx.fillText(author.toUpperCase(), canvas.width / 2, canvas.height - 400);

    // Divider line
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 100, canvas.height - 300);
    ctx.lineTo(canvas.width / 2 + 100, canvas.height - 300);
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onSave(dataUrl);
  };

  return (
    <div className="sheet-backdrop" style={{ zIndex: 9999 }}>
      <div className="sheet" style={{ maxWidth: 500, padding: 24, display: 'flex', flexDirection: 'column', height: '100dvh' }}>
        <div className="sheet__handle" />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Design 3D Cover</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>

        {/* 3D PREVIEW AREA */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '1000px', background: 'var(--g1-surface-2)', borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
          <div
            ref={bookRef}
            style={{
              width: '200px',
              height: '320px',
              position: 'relative',
              transformStyle: 'preserve-3d',
              transform: 'rotateY(-25deg) rotateX(5deg)',
              transition: 'transform 0.1s ease',
            }}
            onMouseMove={(e) => {
              if (!bookRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left - rect.width / 2;
              const y = e.clientY - rect.top - rect.height / 2;
              bookRef.current.style.transform = `rotateY(${-25 + x / 10}deg) rotateX(${5 - y / 10}deg)`;
            }}
            onMouseLeave={() => {
              if (bookRef.current) bookRef.current.style.transform = 'rotateY(-25deg) rotateX(5deg)';
            }}
          >
            {/* Front Cover */}
            <div style={{
              position: 'absolute', width: '100%', height: '100%',
              background: bgColor, color: textColor,
              transform: 'translateZ(12px)',
              borderRadius: '2px 6px 6px 2px',
              display: 'flex', flexDirection: 'column', padding: '30px 20px', textAlign: 'center',
              boxShadow: 'inset 4px 0 10px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontFamily: fontStyle === 'serif' ? 'Georgia, serif' : 'Inter, sans-serif', fontSize: 24, fontWeight: 800, lineHeight: 1.1, marginTop: 'auto' }}>
                {title}
              </div>
              <div style={{ fontFamily: fontStyle === 'serif' ? 'Georgia, serif' : 'Inter, sans-serif', fontSize: 12, fontWeight: 600, marginTop: 30, marginBottom: 'auto', letterSpacing: 1 }}>
                {author.toUpperCase()}
              </div>
            </div>
            
            {/* Spine */}
            <div style={{
              position: 'absolute', width: '24px', height: '100%',
              background: bgColor,
              transform: 'rotateY(-90deg) translateZ(12px)',
              transformOrigin: 'left',
              boxShadow: 'inset -5px 0 10px rgba(0,0,0,0.3)',
              borderRadius: '2px 0 0 2px'
            }} />
            
            {/* Pages (Right Edge) */}
            <div style={{
              position: 'absolute', width: '100%', height: '100%',
              background: '#fff',
              transform: 'translateZ(-12px)',
              borderRadius: '2px 6px 6px 2px',
              boxShadow: 'inset -5px 0 10px rgba(0,0,0,0.1)'
            }} />
          </div>
        </div>

        {/* CONTROLS */}
        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 20 }}>
          <div className="g1-field">
            <label>Book Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="g1-field">
            <label>Author</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Background</label>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ width: '100%', height: 44, padding: 0, border: 'none', borderRadius: 8 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Text Color</label>
              <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ width: '100%', height: 44, padding: 0, border: 'none', borderRadius: 8 }} />
            </div>
          </div>

          <div className="g1-field">
            <label>Font Style</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setFontStyle('serif')} className={'g1-btn ' + (fontStyle === 'serif' ? 'g1-btn--solid' : 'g1-btn--ghost')} style={{ flex: 1, fontFamily: 'Georgia, serif' }}>Serif</button>
              <button onClick={() => setFontStyle('sans')} className={'g1-btn ' + (fontStyle === 'sans' ? 'g1-btn--solid' : 'g1-btn--ghost')} style={{ flex: 1, fontFamily: 'Inter, sans-serif' }}>Sans</button>
            </div>
          </div>
        </div>

        <button onClick={handleSaveImage} className="g1-btn g1-btn--solid g1-btn--full" style={{ marginTop: 'auto' }}>
          Save as Cover Image
        </button>
      </div>
    </div>
  );
}