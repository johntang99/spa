// System S signature ripple divider. Renders a wave-shaped color transition between two
// sections: the section ABOVE bleeds down into a gentle wave, with the candle-gold ripple
// line riding the crest. This reads as one continuous transition (not a floating line).
export type DividerVariant = 'none' | 'soft-fade' | 'ripple-curve' | 'angle' | 'motif';
export type SectionMode = 'light' | 'well' | 'dark';

const surfaceFor = (mode?: SectionMode) =>
  mode === 'dark' ? 'var(--surface-immersion)' : mode === 'well' ? 'var(--surface-well)' : 'var(--surface-page)';

export default function RippleDivider({
  variant = 'ripple-curve',
  fromMode = 'light',
  toMode = 'light',
}: {
  variant?: DividerVariant;
  fromMode?: SectionMode;
  toMode?: SectionMode;
}) {
  if (variant === 'none') return null;

  const from = surfaceFor(fromMode); // color of the section above
  const to = surfaceFor(toMode); // color of the section below

  // soft-fade: gradient blend between the two surfaces (no line).
  if (variant === 'soft-fade') {
    return <div aria-hidden style={{ height: 40, background: `linear-gradient(${from}, ${to})` }} />;
  }

  // Wave crest path (the bottom edge of the upper section's color fill).
  const crest =
    variant === 'angle'
      ? 'M0,14 L1200,30'
      : 'M0,24 Q 300,40 600,24 T 1200,24';
  // Filled shape: upper-section color across the top, wavy bottom edge into the lower section.
  const fill =
    variant === 'angle'
      ? 'M0,0 H1200 V30 L0,14 Z'
      : 'M0,0 H1200 V24 Q 900,40 600,24 T 0,24 Z';

  return (
    <div aria-hidden style={{ position: 'relative', height: 48, background: to, lineHeight: 0 }}>
      <svg viewBox="0 0 1200 48" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '100%' }}>
        <path d={fill} fill={from} />
        <path d={crest} fill="none" stroke="var(--divider-motif)" strokeWidth="1.5" opacity="0.9" vectorEffect="non-scaling-stroke" />
        {variant === 'motif' && (
          <path d="M0,30 Q 300,44 600,30 T 1200,30" fill="none" stroke="var(--divider-motif)" strokeWidth="1.5" opacity="0.35" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
    </div>
  );
}
