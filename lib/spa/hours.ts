// Open-now computation from site.json hours (System S). Hours are [{ days:[0-6], open:"HH:MM", close:"HH:MM" }].
// day index: 0=Sunday … 6=Saturday (JS getDay convention).
export interface HoursEntry { days: number[]; open: string; close: string }

export interface OpenState {
  isOpen: boolean;
  /** "21:00" close time today if open, else next open "09:00" */
  boundary: string | null;
  /** day index the boundary applies to */
  boundaryDay: number | null;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Current {day, minutes} in a given IANA timezone. */
export function nowInZone(timezone: string, at: Date): { day: number; minutes: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = fmt.formatToParts(at);
  const wd = parts.find((p) => p.type === 'weekday')?.value || 'Sun';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value || '0') % 24;
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || '0');
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { day: dayMap[wd] ?? 0, minutes: hour * 60 + minute };
}

export function computeOpenState(hours: HoursEntry[], timezone: string, at: Date): OpenState {
  if (!hours?.length) return { isOpen: false, boundary: null, boundaryDay: null };
  const { day, minutes } = nowInZone(timezone || 'America/New_York', at);

  // Open today?
  const today = hours.find((h) => h.days.includes(day));
  if (today && minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) {
    return { isOpen: true, boundary: today.close, boundaryDay: day };
  }
  // Not open now — find next opening (today later, or following days).
  if (today && minutes < toMinutes(today.open)) {
    return { isOpen: false, boundary: today.open, boundaryDay: day };
  }
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const entry = hours.find((h) => h.days.includes(d));
    if (entry) return { isOpen: false, boundary: entry.open, boundaryDay: d };
  }
  return { isOpen: false, boundary: null, boundaryDay: null };
}

/** "until 9pm" / "9am" — 12-hour label from "HH:MM". */
export function label12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hr}:${String(m).padStart(2, '0')}${ampm}` : `${hr}${ampm}`;
}
