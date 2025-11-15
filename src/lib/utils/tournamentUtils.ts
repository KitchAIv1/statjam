/**
 * Tournament Utility Functions
 * 
 * Purpose: Shared utility functions for tournament-related formatting
 * Follows .cursorrules: <40 lines per function, single responsibility
 */

/**
 * Format date range for tournament display
 */
export function formatTournamentDateRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return 'Date TBA';
  if (start && !end) {
    try {
      return new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Date TBA';
    }
  }
  if (!start && end) {
    try {
      return new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Date TBA';
    }
  }

  try {
    const startDate = new Date(start as string);
    const endDate = new Date(end as string);
    const sameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear();

    if (sameMonth) {
      const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(startDate);
      return `${month} ${startDate.getDate()}–${endDate.getDate()}, ${startDate.getFullYear()}`;
    }

    const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    return `${formatter.format(startDate)} – ${formatter.format(endDate)}, ${startDate.getFullYear()}`;
  } catch (error) {
    return 'Date TBA';
  }
}

/**
 * Get initials from a name (first letter of each word, max 2)
 */
export function getPlayerInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

