'use client';

// OpenNowBadge — renders "Open now · until 9pm" / "Opens 9am" from site.json hours.
// Computes on the client so it stays correct across hour boundaries regardless of ISR caching.
import { useEffect, useState } from 'react';
import { computeOpenState, label12, type HoursEntry } from '@/lib/spa/hours';

const DAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function OpenNowBadge({
  hours,
  timezone,
  locale,
  className = 'open-now',
}: {
  hours: HoursEntry[];
  timezone: string;
  locale: 'en' | 'zh';
  className?: string;
}) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    function update() {
      const state = computeOpenState(hours, timezone, new Date());
      if (!state.boundary) { setLabel(null); return; }
      const sameDayName = (d: number) => (locale === 'zh' ? DAY_ZH[d] : DAY_EN[d]);
      if (state.isOpen) {
        setLabel(locale === 'zh' ? `营业中 · 至${label12(state.boundary)}` : `Open now · until ${label12(state.boundary)}`);
      } else {
        const dayPrefix = state.boundaryDay !== null ? `${sameDayName(state.boundaryDay)} ` : '';
        setLabel(locale === 'zh' ? `${dayPrefix}${label12(state.boundary)} 开门` : `Opens ${dayPrefix}${label12(state.boundary)}`);
      }
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [hours, timezone, locale]);

  if (!label) return null;
  return (
    <span className={className}>
      <span className="dot" aria-hidden />
      {label}
    </span>
  );
}
