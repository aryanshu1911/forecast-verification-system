/**
 * Unified Data Loader - Single Source of Truth
 * Provides centralized access to all file-based data with lazy loading and caching
 */

import { FileStorageManager, WarningData, RealisedData } from './fileStorageManager';
import { parseDate, formatDate } from './dateUtils';

// Initialize storage manager
const storage = new FileStorageManager();

// Simple in-memory cache
const cache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
}

/**
 * Load warning data for a specific date and lead day
 */
export async function loadWarningForDate(
  year: number,
  month: number,
  day: number,
  leadDay: string
): Promise<WarningData | null> {
  const cacheKey = `warning_${year}_${month}_${day}_${leadDay}`;
  
  // Check cache
  const cached = cache.get(cacheKey) as CacheEntry;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // Load from disk
  const data = await storage.loadWarningData(year, month, day, leadDay);
  
  // Cache result
  if (data) {
    cache.set(cacheKey, { data, timestamp: Date.now() });
  }
  
  return data;
}

/**
 * Load realised data for a specific date
 */
export async function loadRealisedForDate(
  year: number,
  month: number,
  day: number
): Promise<RealisedData | null> {
  const cacheKey = `realised_${year}_${month}_${day}`;
  
  // Check cache
  const cached = cache.get(cacheKey) as CacheEntry;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // Load from disk
  const data = await storage.loadRealisedData(year, month, day);
  
  // Cache result
  if (data) {
    cache.set(cacheKey, { data, timestamp: Date.now() });
  }
  
  return data;
}

/**
 * Load data for a date range
 */
export async function loadDataForDateRange(
  startDate: string,
  endDate: string,
  leadDay?: string
): Promise<{
  warning: Map<string, WarningData>;
  realised: Map<string, RealisedData>;
}> {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  const warningData = new Map<string, WarningData>();
  const realisedData = new Map<string, RealisedData>();
  
  // Iterate through date range
  const currentDate = new Date(start.year, start.month - 1, start.day);
  const endDateObj = new Date(end.year, end.month - 1, end.day);
  
  while (currentDate <= endDateObj) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    const dateStr = formatDate(year, month, day);
    
    // Load warning data if leadDay specified
    if (leadDay) {
      const warning = await loadWarningForDate(year, month, day, leadDay);
      if (warning) {
        warningData.set(dateStr, warning);
      }
    }
    
    // Load realised data
    const realised = await loadRealisedForDate(year, month, day);
    if (realised) {
      realisedData.set(dateStr, realised);
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return { warning: warningData, realised: realisedData };
}

/**
 * Load all warning data for a month (all lead days)
 */
export async function loadMonthWarningData(
  year: number,
  month: number
): Promise<Map<string, WarningData>> {
  const cacheKey = `month_warning_${year}_${month}`;
  
  // Check cache
  const cached = cache.get(cacheKey) as CacheEntry;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // Load from disk
  const data = await storage.loadMonthWarningData(year, month);
  
  // Cache result
  cache.set(cacheKey, { data, timestamp: Date.now() });
  
  return data;
}

/**
 * Load all realised data for a month
 */
export async function loadMonthRealisedData(
  year: number,
  month: number
): Promise<Map<string, RealisedData>> {
  const cacheKey = `month_realised_${year}_${month}`;
  
  // Check cache
  const cached = cache.get(cacheKey) as CacheEntry;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // Load from disk
  const data = await storage.loadMonthRealisedData(year, month);
  
  // Cache result
  cache.set(cacheKey, { data, timestamp: Date.now() });
  
  return data;
}

/**
 * Get available dates for a month
 */
export async function getAvailableDates(
  year: number,
  month: number
): Promise<string[]> {
  const cacheKey = `available_dates_${year}_${month}`;
  
  // Check cache
  const cached = cache.get(cacheKey) as CacheEntry;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // Load from disk
  const dates = await storage.getAvailableDates(year, month);
  
  // Cache result
  cache.set(cacheKey, { data: dates, timestamp: Date.now() });
  
  return dates;
}

/**
 * Check if data exists for a specific date
 */
export async function hasDataForDate(
  year: number,
  month: number,
  day: number,
  type: 'warning' | 'realised',
  leadDay?: string
): Promise<boolean> {
  if (type === 'warning') {
    if (!leadDay) {
      // Check if any lead day has data
      const leadDays = ['D1', 'D2', 'D3', 'D4', 'D5'];
      for (const ld of leadDays) {
        if (await storage.hasWarningData(year, month, day, ld)) {
          return true;
        }
      }
      return false;
    }
    return await storage.hasWarningData(year, month, day, leadDay);
  } else {
    return await storage.hasRealisedData(year, month, day);
  }
}

/**
 * Aggregate monthly statistics
 */
export async function aggregateMonthStats(
  year: number,
  month: number,
  leadDay: string
): Promise<{
  totalDays: number;
  daysWithWarning: number;
  daysWithRealised: number;
  daysWithBoth: number;
}> {
  const warningData = await loadMonthWarningData(year, month);
  const realisedData = await loadMonthRealisedData(year, month);
  
  const warningDates = new Set<string>();
  const realisedDates = new Set(realisedData.keys());
  
  // Filter warning data by lead day
  for (const [key, data] of warningData.entries()) {
    if (data.leadDay === leadDay) {
      warningDates.add(data.date);
    }
  }
  
  const daysWithBoth = Array.from(warningDates).filter(date => 
    realisedDates.has(date)
  ).length;
  
  return {
    totalDays: new Date(year, month, 0).getDate(),
    daysWithWarning: warningDates.size,
    daysWithRealised: realisedDates.size,
    daysWithBoth
  };
}

/**
 * Clear cache (call after new upload)
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}

// Export types
export type { WarningData, RealisedData } from './fileStorageManager';
