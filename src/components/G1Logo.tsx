export function G1Logo({ size = 32, variant = 'color' }: { size?: number; variant?: 'color' | 'white' }) {
  const fg = variant === 'white' ? '#FFFFFF' : 'var(--g1-primary)';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 4a20 20 0 1 0 20 20h-9.5A10.5 10.5 0 1 1 24 13.5V4Z" fill={fg} />
      <rect x="24" y="24" width="20" height="8" rx="4" fill={fg} />
      <circle cx="42" cy="8" r="4" fill={fg} />
    </svg>
  );
}

export function G1Wordmark({ height = 28, variant = 'color' }: { height?: number; variant?: 'color' | 'white' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <G1Logo size={height} variant={variant} />
      <span style={{ fontWeight: 800, fontSize: height * 0.72, letterSpacing: '-0.02em', color: variant === 'white' ? '#FFF' : 'var(--g1-text)' }}>
        G1
        <span style={{ color: variant === 'white' ? 'rgba(255,255,255,0.7)' : 'var(--g1-text-secondary)', fontWeight: 600, marginLeft: 6 }}>ID</span>
      </span>
    </div>
  );
}