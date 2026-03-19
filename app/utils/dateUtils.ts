/**
 * Date Utilities for IMD Upload System
 * Handles date validation, formatting, and month calculations
 */

/**
 * Get number of days in a month (handles leap years)
 */
export function getDaysInMonth(year: number, month: number): number {
  const daysInMonth: { [key: number]: number } = {
    1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30,
    7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31
  };
  
  let days = daysInMonth[month];
  
  // Handle leap year for February
  if (month === 2 && isLeapYear(year)) {
    days = 29;
  }
  
  return days;
}

/**
 * Check if a year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Validate date components
 */
export function isValidDate(year: number, month: number, day: number): boolean {
  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  
  const daysInMonth = getDaysInMonth(year, month);
  if (day < 1 || day > daysInMonth) return false;
  
  return true;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Parse date string to components
 */
export function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-');
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
    day: parseInt(parts[2], 10)
  };
}

/**
 * CRITICAL: Calculate issue date for a given target date and lead day
 * 
 * Lead Day Definitions (Meteorologically Correct):
 * - D1: Same-day forecast (issue date = target date)
 * - D2: Forecast issued 1 day before (issue date = target date - 1)
 * - D3: Forecast issued 2 days before (issue date = target date - 2)
 * - D4: Forecast issued 3 days before (issue date = target date - 3)
 * - D5: Forecast issued 4 days before (issue date = target date - 4)
 * 
 * Formula: Issue Date = Target Date - (Dx - 1)
 * 
 * @param targetYear - Target date year
 * @param targetMonth - Target date month (1-12)
 * @param targetDay - Target date day
 * @param leadDay - Lead day string (D1, D2, D3, D4, D5)
 * @returns Object with issue date components and formatted string
 */
export function calculateIssueDate(
  targetYear: number,
  targetMonth: number,
  targetDay: number,
  leadDay: string
): { year: number; month: number; day: number; dateStr: string } {
  // Extract lead day number (D1 -> 1, D2 -> 2, etc.)
  const leadDayNum = parseInt(leadDay.replace('D', ''));
  
  // Calculate days to subtract: D1=0, D2=1, D3=2, D4=3, D5=4
  const daysToSubtract = leadDayNum - 1;
  
  // Create target date and subtract days
  const targetDate = new Date(targetYear, targetMonth - 1, targetDay);
  const issueDate = new Date(targetDate);
  issueDate.setDate(issueDate.getDate() - daysToSubtract);
  
  // Extract components
  const year = issueDate.getFullYear();
  const month = issueDate.getMonth() + 1;
  const day = issueDate.getDate();
  const dateStr = formatDate(year, month, day);
  
  return { year, month, day, dateStr };
}

/**
 * CRITICAL: Calculate verification date using IMD's shifted verification methodology (D+1)
 * 
 * IMD Shifted Verification Logic:
 * - Warning issued on Day D is verified against realised data from Day D+1
 * - D1 forecast issued on June 1 → verifies with June 2 realised data
 * - D2 forecast issued on June 1 → verifies with June 3 realised data
 * - D3 forecast issued on June 1 → verifies with June 4 realised data
 * - D4 forecast issued on June 1 → verifies with June 5 realised data
 * - D5 forecast issued on June 1 → verifies with June 6 realised data
 * 
 * Formula: Verification Date = Issue Date + Lead Day Number
 * 
 * @param issueYear - Issue date year (when forecast was issued)
 * @param issueMonth - Issue date month (1-12)
 * @param issueDay - Issue date day
 * @param leadDay - Lead day string (D1, D2, D3, D4, D5)
 * @returns Object with verification date components and formatted string
 */
export function calculateVerificationDate(
  issueYear: number,
  issueMonth: number,
  issueDay: number,
  leadDay: string
): { year: number; month: number; day: number; dateStr: string } {
  // Extract lead day number (D1 -> 1, D2 -> 2, etc.)
  const leadDayNum = parseInt(leadDay.replace('D', ''));
  
  // Create issue date and add lead day number to get verification date
  const issueDate = new Date(issueYear, issueMonth - 1, issueDay);
  const verificationDate = new Date(issueDate);
  verificationDate.setDate(verificationDate.getDate() + leadDayNum);
  
  // Extract components
  const year = verificationDate.getFullYear();
  const month = verificationDate.getMonth() + 1;
  const day = verificationDate.getDate();
  const dateStr = formatDate(year, month, day);
  
  return { year, month, day, dateStr };
}

/**
 * Get month name from number
 */
export function getMonthName(month: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[month - 1] || '';
}

/**
 * Validate year range for uploads
 */
export function isValidYear(year: number): boolean {
  return year >= 2020 && year <= 2030;
}

/**
 * Validate month
 */
export function isValidMonth(month: number): boolean {
  return month >= 1 && month <= 12;
}

/**
 * Validate lead day
 */
export function isValidLeadDay(leadDay: string): boolean {
  return ['D1', 'D2', 'D3', 'D4', 'D5'].includes(leadDay);
}
