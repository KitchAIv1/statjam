/**
 * Countdown Utility Functions
 * 
 * Purpose: Format countdown timers and registration deadlines
 * Follows .cursorrules: <40 lines per function, single responsibility
 */

/**
 * Format countdown time remaining until deadline
 */
export function formatCountdown(deadline: Date | string): string {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  const diff = deadlineDate.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Registration Closed';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} left`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} left`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} left`;
  } else {
    return 'Less than a minute left';
  }
}

/**
 * Check if registration is still open
 */
export function isRegistrationOpen(deadline: Date | string): boolean {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  return deadlineDate.getTime() > new Date().getTime();
}

/**
 * Format registration deadline date
 */
export function formatRegistrationDeadline(deadline: Date | string): string {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  return deadlineDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

