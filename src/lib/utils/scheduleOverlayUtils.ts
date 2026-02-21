/**
 * Schedule overlay formatting utilities
 */

/** YYYY-MM-DD in local timezone - used for select value/option matching. */
export function toScheduleDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD to Date at local noon (avoids UTC rollover). */
export function parseScheduleDateString(s: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  return isNaN(date.getTime()) ? null : date;
}

export function formatScheduleTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatScheduleDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function isSameCalendarDay(iso: string, refDate: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === refDate.getFullYear() &&
    d.getMonth() === refDate.getMonth() &&
    d.getDate() === refDate.getDate()
  );
}

/** Unique calendar days that have games, sorted ascending. */
export function getUniqueScheduleDates(games: { start_time: string }[]): Date[] {
  const seen = new Set<string>();
  const dates: Date[] = [];
  for (const g of games) {
    const d = new Date(g.start_time);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!seen.has(key)) {
      seen.add(key);
      dates.push(d);
    }
  }
  dates.sort((a, b) => a.getTime() - b.getTime());
  return dates;
}
