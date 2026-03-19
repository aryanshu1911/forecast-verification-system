/**
 * Realised Sheet Parser
 * Parses Realised (Observed) Excel files with day-column format
 * Structure: District | 1 | 2 | 3 | ... | 30 | 31
 */

import * as XLSX from 'xlsx';
import { getDaysInMonth } from './dateUtils';

export interface RealisedSheetRow {
  district: string;
  dailyValues: { [day: number]: number | null };
}

export interface ParsedRealisedData {
  rows: RealisedSheetRow[];
  daysInMonth: number;
}

/**
 * Parse Realised Excel file
 * @param fileBuffer - Excel file buffer
 * @param year - Year for the data
 * @param month - Month number (1-12)
 * @returns Parsed realised data
 */
export function parseRealisedSheet(
  fileBuffer: Buffer,
  year: number,
  month: number
): ParsedRealisedData {
  // Read Excel file
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  
  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON (array of arrays)
  const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (!data || data.length === 0) {
    throw new Error('Empty Excel file');
  }
  
  // Calculate expected days in month
  const daysInMonth = getDaysInMonth(year, month);
  
  // Find header row (should contain "District" and day numbers)
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row && row.length > 0) {
      const firstCell = String(row[0] || '').toLowerCase().trim();
      if (firstCell.includes('district')) {
        headerRowIndex = i;
        break;
      }
    }
  }
  
  if (headerRowIndex === -1) {
    throw new Error('Could not find header row with "District" column');
  }
  
  // Validate header has day columns (1, 2, 3, ...)
  const headerRow = data[headerRowIndex];
  const expectedColumns = daysInMonth + 1; // District column + day columns
  
  if (headerRow.length < expectedColumns) {
    throw new Error(
      `Expected at least ${expectedColumns} columns (District + ${daysInMonth} days), found ${headerRow.length}`
    );
  }
  
  // Parse data rows
  const rows: RealisedSheetRow[] = [];
  
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    
    if (!row || row.length === 0) continue;
    
    // Get district name from first column
    const districtName = String(row[0] || '').trim();
    
    if (!districtName) continue;
    
    // Skip rows that look like headers, separators, or regional groupings
    const skipPatterns = [
      'district', 'total', 'average', 'sum', '---', '===',
      'north konkan', 'south konkan', 'madhya maharashtra', 'marathwada', 'vidarbha'
    ];
    
    const lowerDistrict = districtName.toLowerCase();
    if (skipPatterns.some(pattern => lowerDistrict.includes(pattern))) {
      continue;
    }
    
    // Extract daily values (rainfall in mm)
    const dailyValues: { [day: number]: number | null } = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      const columnIndex = day; // Column 0 is district, column 1 is day 1, etc.
      const cellValue = row[columnIndex];
      
      if (cellValue === undefined || cellValue === null || cellValue === '') {
        dailyValues[day] = null;
      } else {
        const numValue = parseFloat(String(cellValue));
        if (isNaN(numValue)) {
          dailyValues[day] = null;
        } else {
          // Store rainfall value as-is (can be decimal)
          dailyValues[day] = numValue;
        }
      }
    }
    
    rows.push({
      district: districtName.toUpperCase(),
      dailyValues
    });
  }
  
  if (rows.length === 0) {
    throw new Error('No valid district data found in Excel file');
  }
  
  return {
    rows,
    daysInMonth
  };
}

/**
 * Extract day-wise data from parsed realised sheet
 * CRITICAL: Normalizes district names and aggregates Ghats data
 * @param parsedData - Parsed realised data
 * @param day - Day number (1-31)
 * @returns District-wise rainfall values for the specified day (normalized)
 */
export function extractDayData(
  parsedData: ParsedRealisedData,
  day: number
): { [district: string]: number | null } {
  const { normalizeDistrictData } = require('./districtNormalizer');
  
  const rawResult: { [district: string]: number | null } = {};
  
  for (const row of parsedData.rows) {
    rawResult[row.district] = row.dailyValues[day] || null;
  }
  
  // CRITICAL: Normalize district names and aggregate Ghats
  return normalizeDistrictData(rawResult);
}
