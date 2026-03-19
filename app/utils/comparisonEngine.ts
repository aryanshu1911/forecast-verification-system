/**
 * Comparison Engine - Warning vs Realised Analysis
 * Performs verification analysis using file-based data
 * CRITICAL: Uses IMD's shifted verification methodology (D+1 alignment)
 * NOW USES: Admin-configurable dual/multi mode classification
 */

import {
  loadWarningForDate,
  loadRealisedForDate,
  loadDataForDateRange,
  type WarningData,
  type RealisedData
} from './unifiedDataLoader';
import { calculateVerificationDate, parseDate, formatDate } from './dateUtils';
import {
  classifyRainfall,
  classifyCode
} from './rainfallConfig';

export interface Comparison {
  date: string;
  district: string;
  forecastCode: number | null;
  forecastClassification: string; // L, H, VH, XH (or custom)
  realisedRainfall: number | null;
  realisedClassification: string; // L, H, VH, XH (or custom)
  match: boolean;
  type: 'Correct' | 'False Alarm' | 'Missed Event' | 'Correct Non-Event';
}

export interface AccuracyStats {
  totalPredictions: number;
  correct: number;
  falseAlarms: number;
  missedEvents: number;
  correctNonEvents: number;
  accuracy: number;
  pod: number; // Probability of Detection
  far: number; // False Alarm Ratio
  csi: number; // Critical Success Index
  bias: number; // Bias Score
}

/**
 * Classify rainfall using current mode (dual or multi)
 */
async function classifyRainfallValue(rainfall: number): Promise<string> {
  return await classifyRainfall(rainfall);
}

/**
 * Classify warning code using current mode (dual or multi)
 */
async function classifyWarningCode(code: number): Promise<string> {
  return await classifyCode(code);
}

/**
 * Check if two classifications match for verification
 * In both dual and multi mode, exact label match = correct
 */
function classificationsMatch(forecast: string, realised: string): boolean {
  return forecast === realised;
}

/**
 * CRITICAL: Compare warning vs realised for a single ISSUE date
 * NEW LOGIC: All realized data comes from selectedDate + 1, warnings go backwards
 * 
 * @param issueYear - Issue date year (when forecast was issued)
 * @param issueMonth - Issue date month
 * @param issueDay - Issue date day
 * @param leadDay - Lead day (D1, D2, D3, D4, D5)
 * @param selectedYear - Optional: Selected date year (for new verification logic)
 * @param selectedMonth - Optional: Selected date month (for new verification logic)
 * @param selectedDay - Optional: Selected date day (for new verification logic)
 * @returns Array of comparisons for all districts
 */
export async function compareForDate(
  issueYear: number,
  issueMonth: number,
  issueDay: number,
  leadDay: string,
  selectedYear?: number,
  selectedMonth?: number,
  selectedDay?: number
): Promise<Comparison[]> {
  let verificationDate;
  
  // NEW LOGIC: If selected date is provided, use it to calculate realized date
  if (selectedYear !== undefined && selectedMonth !== undefined && selectedDay !== undefined) {
    // Realized date is always selected date + 1
    const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
    const realizedDate = new Date(selectedDate);
    realizedDate.setDate(realizedDate.getDate() + 1);
    
    verificationDate = {
      year: realizedDate.getFullYear(),
      month: realizedDate.getMonth() + 1,
      day: realizedDate.getDate()
    };
  } else {
    // OLD LOGIC: Calculate verification date using IMD's D+1 shifted methodology
    verificationDate = calculateVerificationDate(issueYear, issueMonth, issueDay, leadDay);
  }
  
  // Load warning data from ISSUE DATE (when forecast was issued)
  const warning = await loadWarningForDate(
    issueYear,
    issueMonth,
    issueDay,
    leadDay
  );
  
  // Load realised data from VERIFICATION DATE
  const realised = await loadRealisedForDate(
    verificationDate.year,
    verificationDate.month,
    verificationDate.day
  );
  
  if (!warning || !realised) {
    return [];
  }
  
  const comparisons: Comparison[] = [];
  const issueDateStr = formatDate(issueYear, issueMonth, issueDay);
  
  // Get all districts from both datasets
  const allDistricts = new Set([
    ...Object.keys(warning.districts),
    ...Object.keys(realised.districts)
  ]);
  
  for (const district of allDistricts) {
    const warningCode = warning.districts[district];
    const realisedRainfall = realised.districts[district];
    
    // Skip if both are null/undefined
    if (warningCode == null && realisedRainfall == null) {
      continue;
    }
    
    const forecastClass = warningCode != null ? await classifyWarningCode(warningCode) : 'L';
    const realisedClass = realisedRainfall != null ? await classifyRainfallValue(realisedRainfall) : 'L';
    
    const match = classificationsMatch(forecastClass, realisedClass);
    
    let type: 'Correct' | 'False Alarm' | 'Missed Event' | 'Correct Non-Event';
    
    // In dual mode, match is binary (L vs H).
    // In multi mode, match is exact (H vs H, VH vs VH, etc.)
    // For POD/FAR/CSI metrics, we usually treat any "Heavy" as a hit 
    // unless we are doing specific category verification.
    if (match) {
      type = 'Correct';
    } else {
      // Determine if forecast predicted heavy (not L)
      const forecastHeavy = forecastClass !== 'L';
      const realisedHeavy = realisedClass !== 'L';
      
      if (forecastHeavy && realisedHeavy) {
        // Both are some kind of Heavy (e.g. H and VH), so it's a Hit for binary verification
        // but not an exact match. We'll call it Correct to stay in binary Hit category.
        type = 'Correct';
      } else if (forecastHeavy && !realisedHeavy) {
        type = 'False Alarm';
      } else if (!forecastHeavy && realisedHeavy) {
        type = 'Missed Event';
      } else {
        type = 'Correct Non-Event';
      }
    }
    
    comparisons.push({
      date: issueDateStr,
      district,
      forecastCode: warningCode,
      forecastClassification: forecastClass,
      realisedRainfall,
      realisedClassification: realisedClass,
      match,
      type
    });
  }
  
  return comparisons;
}

/**
 * CRITICAL: Compare warning vs realised for a date range
 * Uses IMD's shifted verification methodology for each issue date
 */
export async function compareForDateRange(
  startDate: string,
  endDate: string,
  leadDay: string
): Promise<Comparison[]> {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  const allComparisons: Comparison[] = [];
  
  // Iterate through ISSUE date range (not target dates)
  const currentDate = new Date(start.year, start.month - 1, start.day);
  const endDateObj = new Date(end.year, end.month - 1, end.day);
  
  while (currentDate <= endDateObj) {
    const issueYear = currentDate.getFullYear();
    const issueMonth = currentDate.getMonth() + 1;
    const issueDay = currentDate.getDate();
    
    // Get comparisons for this issue date
    const comparisons = await compareForDate(issueYear, issueMonth, issueDay, leadDay);
    allComparisons.push(...comparisons);
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return allComparisons;
}

/**
 * Calculate accuracy statistics from comparisons
 * VALIDATED: Formulas match meteorological standards
 * 
 * Contingency Table:
 * - H (Hits): Heavy forecast AND heavy observed
 * - M (Misses): No heavy forecast BUT heavy observed  
 * - F (False Alarms): Heavy forecast BUT not heavy observed
 * - CN (Correct Negatives): No heavy forecast AND no heavy observed
 * 
 * Skill Scores:
 * - POD = H / (H + M)  [Probability of Detection]
 * - FAR = F / (H + F)  [False Alarm Ratio]
 * - CSI = H / (H + M + F)  [Critical Success Index]
 * - Bias = (H + F) / (H + M)  [Frequency Bias]
 */
export function calculateAccuracy(comparisons: Comparison[]): AccuracyStats {
  if (comparisons.length === 0) {
    return {
      totalPredictions: 0,
      correct: 0,
      falseAlarms: 0,
      missedEvents: 0,
      correctNonEvents: 0,
      accuracy: 0,
      pod: 0,
      far: 0,
      csi: 0,
      bias: 0
    };
  }
  
  // Count each type
  const correct = comparisons.filter(c => c.type === 'Correct').length;
  const falseAlarms = comparisons.filter(c => c.type === 'False Alarm').length;
  const missedEvents = comparisons.filter(c => c.type === 'Missed Event').length;
  const correctNonEvents = comparisons.filter(c => c.type === 'Correct Non-Event').length;
  
  const totalPredictions = comparisons.length;
  const accuracy = ((correct + correctNonEvents) / totalPredictions) * 100;
  
  // Contingency table values (using meteorological terminology)
  const H = correct; // Hits: Heavy forecast AND heavy observed
  const M = missedEvents; // Misses: No heavy forecast BUT heavy observed
  const F = falseAlarms; // False Alarms: Heavy forecast BUT not heavy observed
  const CN = correctNonEvents; // Correct Negatives: No heavy forecast AND no heavy observed
  
  // Calculate skill scores with division-by-zero guards
  // POD = H / (H + M) - Probability of Detection
  const pod = (H + M) > 0 ? H / (H + M) : 0;
  
  // FAR = F / (H + F) - False Alarm Ratio
  // Special case: If (H + F) = 0, FAR = 0 (not NaN)
  const far = (H + F) > 0 ? F / (H + F) : 0;
  
  // CSI = H / (H + M + F) - Critical Success Index
  const csi = (H + M + F) > 0 ? H / (H + M + F) : 0;
  
  // Bias = (H + F) / (H + M) - Frequency Bias
  const bias = (H + M) > 0 ? (H + F) / (H + M) : 0;
  
  return {
    totalPredictions,
    correct: H,
    falseAlarms: F,
    missedEvents: M,
    correctNonEvents: CN,
    accuracy,
    pod,
    far,
    csi,
    bias
  };
}

/**
 * Compare across multiple lead days
 */
export async function compareMultipleLeadDays(
  startDate: string,
  endDate: string,
  leadDays: string[]
): Promise<Map<string, { comparisons: Comparison[]; stats: AccuracyStats }>> {
  const results = new Map<string, { comparisons: Comparison[]; stats: AccuracyStats }>();
  
  for (const leadDay of leadDays) {
    const comparisons = await compareForDateRange(startDate, endDate, leadDay);
    const stats = calculateAccuracy(comparisons);
    results.set(leadDay, { comparisons, stats });
  }
  
  return results;
}

/**
 * Get district-wise accuracy
 */
export function getDistrictWiseAccuracy(
  comparisons: Comparison[]
): Map<string, AccuracyStats> {
  const districtMap = new Map<string, Comparison[]>();
  
  // Group by district
  for (const comparison of comparisons) {
    if (!districtMap.has(comparison.district)) {
      districtMap.set(comparison.district, []);
    }
    districtMap.get(comparison.district)!.push(comparison);
  }
  
  // Calculate stats for each district
  const districtStats = new Map<string, AccuracyStats>();
  for (const [district, districtComparisons] of districtMap.entries()) {
    districtStats.set(district, calculateAccuracy(districtComparisons));
  }
  
  return districtStats;
}
