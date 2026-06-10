// System S signature ripple divider (A4 registry: none | soft-fade | ripple-curve | angle | motif).
// A thin curved line drawn in the accent token, used at section mode switches. Server component.
export type DividerVariant = 'none' | 'soft-fade' | 'ripple-curve' | 'angle' | 'motif';

export default function RippleDivider({ variant = 'ripple-curve' }: { variant?: DividerVariant }) {
  if (variant === 'none') return null;
  if (variant === 'soft-fade') return <div className="divider fade" aria-hidden />;

  if (variant === 'angle') {
    return (
      <div className="divider" aria-hidden>
        <svg viewBox="0 0 1200 56" preserveAspectRatio="none">
          <path className="ripple-line" d="M0 40 L1200 16" />
        </svg>
      </div>
    );
  }

  if (variant === 'motif') {
    return (
      <div className="divider" aria-hidden>
        <svg viewBox="0 0 1200 56" preserveAspectRatio="none">
          <path className="ripple-line" d="M0 28 Q 300 8 600 28 T 1200 28" />
          <path className="ripple-line" d="M0 36 Q 300 16 600 36 T 1200 36" opacity="0.4" />
        </svg>
      </div>
    );
  }

  // ripple-curve (default) — single steam/water ripple line.
  return (
    <div className="divider" aria-hidden>
      <svg viewBox="0 0 1200 56" preserveAspectRatio="none">
        <path className="ripple-line" d="M0 28 Q 300 6 600 28 T 1200 28" />
      </svg>
    </div>
  );
}
