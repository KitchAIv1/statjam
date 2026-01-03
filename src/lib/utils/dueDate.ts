/**
 * Due Date Utility
 * 
 * Calculates the due date for video tracking turnaround.
 * Turnaround deadline: 12:00 AM (midnight) EST/EDT, 2 days from upload.
 * This gives StatJam a full business day to complete tracking.
 * 
 * Example: If upload happens at 3pm EST on Jan 3rd, due date is 12:00 AM EST on Jan 5th.
 * That means ~33 hours for tracking (all of Jan 4th + until midnight Jan 5th).
 */

/**
 * Calculate midnight EST of the NEXT day
 * Returns a Date object set to 12:00 AM EST/EDT of the following day
 * 
 * Handles:
 * - Month/year rollovers correctly
 * - DST transitions (EST vs EDT)
 */
export function getNextMidnightEST(): Date {
  // Get current time
  const now = new Date();
  
  // Get current date in EST timezone (YYYY-MM-DD format)
  const estDateStr = now.toLocaleDateString('en-CA', { 
    timeZone: 'America/New_York' 
  });
  
  // Parse the EST date
  const [year, month, day] = estDateStr.split('-').map(Number);
  
  // Calculate the day AFTER tomorrow (2 days from now) for full business day turnaround
  // Upload on Jan 3rd afternoon → Due midnight Jan 5th (gives all of Jan 4th for processing)
  const tempDate = new Date(Date.UTC(year, month - 1, day));
  tempDate.setUTCDate(tempDate.getUTCDate() + 2); // Add 2 days for full business day
  
  const tomorrowYear = tempDate.getUTCFullYear();
  const tomorrowMonth = String(tempDate.getUTCMonth() + 1).padStart(2, '0');
  const tomorrowDay = String(tempDate.getUTCDate()).padStart(2, '0');
  
  // Determine if tomorrow is in DST (EDT) or standard time (EST)
  // January = EST (UTC-5), July = EDT (UTC-4)
  // We check by seeing what timezone name is used for that date
  const testDateStr = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}T12:00:00`;
  const testDate = new Date(testDateStr + 'Z'); // Parse as UTC noon
  const tzName = testDate.toLocaleString('en-US', { 
    timeZone: 'America/New_York', 
    timeZoneName: 'short' 
  });
  const isDST = tzName.includes('EDT');
  
  // Build midnight timestamp with correct offset
  // EST = UTC-5 (so midnight EST = 05:00 UTC)
  // EDT = UTC-4 (so midnight EDT = 04:00 UTC)
  const utcHour = isDST ? 4 : 5;
  
  // Create the due date as midnight EST/EDT of tomorrow
  const dueDate = new Date(Date.UTC(
    tomorrowYear, 
    tempDate.getUTCMonth(), 
    tempDate.getUTCDate(), 
    utcHour, 
    0, 
    0, 
    0
  ));
  
  return dueDate;
}

/**
 * Get midnight EST as ISO string for database storage
 */
export function getNextMidnightESTISOString(): string {
  return getNextMidnightEST().toISOString();
}

