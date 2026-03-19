/**
 * Data Loader for File-Based Storage
 * Provides clean API for loading Warning and Realised data from disk
 */

import { FileStorageManager, WarningData, RealisedData } from './fileStorageManager';

const storage = new FileStorageManager();

/**
 * Load warning data for a specific date and lead day
 */
export async function loadWarningData(
  year: number,
  month: number,
  day: number,
  leadDay: string
): Promise<WarningData | null> {
  return await storage.loadWarningData(year, month, day, leadDay);
}

/**
 * Load realised data for a specific date
 */
export async function loadRealisedData(
  year: number,
  month: number,
  day: number
): Promise<RealisedData | null> {
  return await storage.loadRealisedData(year, month, day);
}

/**
 * Load all warning data for a month (all lead days)
 */
export async function loadMonthWarningData(
  year: number,
  month: number
): Promise<Map<string, WarningData>> {
  return await storage.loadMonthWarningData(year, month);
}

/**
 * Load all realised data for a month
 */
export async function loadMonthRealisedData(
  year: number,
  month: number
): Promise<Map<string, RealisedData>> {
  return await storage.loadMonthRealisedData(year, month);
}

/**
 * Check if warning data exists for a specific date and lead day
 */
export async function hasWarningData(
  year: number,
  month: number,
  day: number,
  leadDay: string
): Promise<boolean> {
  return await storage.hasWarningData(year, month, day, leadDay);
}

/**
 * Check if realised data exists for a specific date
 */
export async function hasRealisedData(
  year: number,
  month: number,
  day: number
): Promise<boolean> {
  return await storage.hasRealisedData(year, month, day);
}

/**
 * Get list of available dates for a month (dates with realised data)
 */
export async function getAvailableDates(
  year: number,
  month: number
): Promise<string[]> {
  return await storage.getAvailableDates(year, month);
}

/**
 * Check if data exists for a specific date (both warning and realised)
 */
export async function hasDataForDate(
  year: number,
  month: number,
  day: number,
  type: 'warning' | 'realised'
): Promise<boolean> {
  if (type === 'warning') {
    // Check if any lead day has data
    const leadDays = ['D1', 'D2', 'D3', 'D4', 'D5'];
    for (const leadDay of leadDays) {
      if (await storage.hasWarningData(year, month, day, leadDay)) {
        return true;
      }
    }
    return false;
  } else {
    return await storage.hasRealisedData(year, month, day);
  }
}

// Export types for convenience
export type { WarningData, RealisedData } from './fileStorageManager';
