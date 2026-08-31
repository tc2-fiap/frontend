// Mark path and wordmark treatment lifted verbatim from
// ../../design/logo-mark.svg and ../../design/wordmark.svg — see
// ../../design/style-guide.md for the rationale and usage rules
// (don't recolor, don't rotate the notch).
const MARK_PATH =
  'M22,8 H42 Q56,8 56,22 V42 Q56,56 42,56 H22 Q8,56 8,42 V22 Q8,8 22,8 Z M56,20 L34,32 L56,44 Z';

export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="FIAP Games">
      <path fillRule="evenodd" fill="var(--color-accent)" d={MARK_PATH} />
    </svg>
  );
}

export function Logo({ size = 22 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: size, lineHeight: 1 }}>
      <LogoMark size={size + 6} />
      <span style={{ fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--color-text)' }}>FIAP</span>
      <span style={{ fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--color-accent)', marginLeft: -6 }}>
        Games
      </span>
    </span>
  );
}
