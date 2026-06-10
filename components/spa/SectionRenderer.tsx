// Maps a page's layout (ordered section ids + light/dark mode) to System S section
// components, inserting a ripple divider at every light↔dark mode switch (A5 rhythm).
// Reused by every Phase 1 page. Unknown section ids are skipped (logged in dev).
import React from 'react';
import { SECTION_COMPONENTS, SectionCtx } from './sections';
import RippleDivider from './RippleDivider';
import RevealInit from './RevealInit';

export interface LayoutSection { id: string; mode?: 'light' | 'well' | 'dark' }

export default function SectionRenderer({
  page,
  layout,
  ctx,
}: {
  page: Record<string, any>;
  layout: { sections?: LayoutSection[] } | null;
  ctx: SectionCtx;
}) {
  const sections = layout?.sections || [];
  const isDark = (m?: string) => m === 'dark';
  let prevMode: string | undefined;

  return (
    <>
      <RevealInit />
      {sections.map((s, i) => {
        const Comp = SECTION_COMPONENTS[s.id];
        const data = page[s.id];
        if (!Comp || data === undefined) {
          if (process.env.NODE_ENV !== 'production') console.warn(`[SectionRenderer] no component/data for "${s.id}"`);
          return null;
        }
        // Ripple divider at every mode switch into/out of a dark immersion section.
        const divider = i > 0 && isDark(prevMode) !== isDark(s.mode)
          ? <RippleDivider key={`d-${i}`} variant="ripple-curve" />
          : null;
        prevMode = s.mode;
        return (
          <React.Fragment key={`${s.id}-${i}`}>
            {divider}
            <Comp data={data} ctx={{ ...ctx, mode: s.mode }} />
          </React.Fragment>
        );
      })}
    </>
  );
}
