/**
 * Upload Processor
 * Orchestrates the upload workflow - parse Excel, extract day-wise data, save to disk
 */

import { FileStorageManager } from './fileStorageManager';
import { parseWarningSheet, extractDayData as extractWarningDayData } from './warningSheetParser';
import { parseRealisedSheet, extractDayData as extractRealisedDayData } from './realisedSheetParser';
import { getDaysInMonth, isValidYear, isValidMonth, isValidLeadDay } from './dateUtils';

export interface UploadMetadata {
  year: number;
  month: number;
  leadDay?: string; // Only for warning uploads
}

export interface UploadSummary {
  year: number;
  month: number;
  leadDay?: string;
  daysProcessed: number;
  filesCreated: number;
  errors: string[];
  warnings: string[];
}

/**
 * Process Warning Excel upload
 */
export async function processWarningUpload(
  fileBuffer: Buffer,
  metadata: UploadMetadata
): Promise<UploadSummary> {
  const { year, month, leadDay } = metadata;
  
  // Validate metadata
  if (!isValidYear(year)) {
    throw new Error(`Invalid year: ${year}. Must be between 2020 and 2030.`);
  }
  
  if (!isValidMonth(month)) {
    throw new Error(`Invalid month: ${month}. Must be between 1 and 12.`);
  }
  
  if (!leadDay || !isValidLeadDay(leadDay)) {
    throw new Error(`Invalid lead day: ${leadDay}. Must be D1, D2, D3, D4, or D5.`);
  }
  
  const summary: UploadSummary = {
    year,
    month,
    leadDay,
    daysProcessed: 0,
    filesCreated: 0,
    errors: [],
    warnings: []
  };
  
  try {
    // Parse Excel file
    const parsedData = parseWarningSheet(fileBuffer, year, month);
    const daysInMonth = getDaysInMonth(year, month);
    
    // Initialize storage manager
    const storage = new FileStorageManager();
    
    // Process each day
    for (let day = 1; day <= daysInMonth; day++) {
      try {
        // Extract data for this day
        const dayData = extractWarningDayData(parsedData, day);
        
        // Save to disk
        await storage.saveWarningData(year, month, day, leadDay, dayData);
        
        summary.daysProcessed++;
        summary.filesCreated++;
      } catch (error) {
        const errorMsg = `Day ${day}: ${error instanceof Error ? error.message : String(error)}`;
        summary.errors.push(errorMsg);
      }
    }
    
    // Add warning if some days failed
    if (summary.errors.length > 0) {
      summary.warnings.push(
        `${summary.errors.length} out of ${daysInMonth} days failed to process`
      );
    }
    
  } catch (error) {
    throw new Error(`Failed to process warning upload: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return summary;
}

/**
 * Process Realised Excel upload
 */
export async function processRealisedUpload(
  fileBuffer: Buffer,
  metadata: UploadMetadata
): Promise<UploadSummary> {
  const { year, month } = metadata;
  
  // Validate metadata
  if (!isValidYear(year)) {
    throw new Error(`Invalid year: ${year}. Must be between 2020 and 2030.`);
  }
  
  if (!isValidMonth(month)) {
    throw new Error(`Invalid month: ${month}. Must be between 1 and 12.`);
  }
  
  const summary: UploadSummary = {
    year,
    month,
    daysProcessed: 0,
    filesCreated: 0,
    errors: [],
    warnings: []
  };
  
  try {
    // Parse Excel file
    const parsedData = parseRealisedSheet(fileBuffer, year, month);
    const daysInMonth = getDaysInMonth(year, month);
    
    // Initialize storage manager
    const storage = new FileStorageManager();
    
    // Process each day
    for (let day = 1; day <= daysInMonth; day++) {
      try {
        // Extract data for this day
        const dayData = extractRealisedDayData(parsedData, day);
        
        // Save to disk
        await storage.saveRealisedData(year, month, day, dayData);
        
        summary.daysProcessed++;
        summary.filesCreated++;
      } catch (error) {
        const errorMsg = `Day ${day}: ${error instanceof Error ? error.message : String(error)}`;
        summary.errors.push(errorMsg);
      }
    }
    
    // Add warning if some days failed
    if (summary.errors.length > 0) {
      summary.warnings.push(
        `${summary.errors.length} out of ${daysInMonth} days failed to process`
      );
    }
    
  } catch (error) {
    throw new Error(`Failed to process realised upload: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return summary;
}

/**
 * Process Multi-Sheet Warning Excel upload
 * Handles a single Excel file with 5 sheets (Day1, Day2, Day3, Day4, Day5)
 * Processes all 5 lead days in one operation
 */
export async function processMultiSheetWarningUpload(
  fileBuffer: Buffer,
  metadata: UploadMetadata
): Promise<UploadSummary> {
  const { year, month } = metadata;
  
  // Validate metadata
  if (!isValidYear(year)) {
    throw new Error(`Invalid year: ${year}. Must be between 2020 and 2030.`);
  }
  
  if (!isValidMonth(month)) {
    throw new Error(`Invalid month: ${month}. Must be between 1 and 12.`);
  }
  
  const summary: UploadSummary = {
    year,
    month,
    daysProcessed: 0,
    filesCreated: 0,
    errors: [],
    warnings: []
  };
  
  try {
    // Import multi-sheet parser
    const { parseMultiSheetWarningFile } = require('./warningSheetParser');
    
    // Parse multi-sheet Excel file
    const multiSheetData = parseMultiSheetWarningFile(fileBuffer, year, month);
    const daysInMonth = getDaysInMonth(year, month);
    
    // Initialize storage manager
    const storage = new FileStorageManager();
    
    // Process each lead day
    const leadDays = ['D1', 'D2', 'D3', 'D4', 'D5'] as const;
    
    for (const leadDay of leadDays) {
      const parsedData = multiSheetData.sheets[leadDay];
      
      // Process each day for this lead day
      for (let day = 1; day <= daysInMonth; day++) {
        try {
          // Extract data for this day
          const dayData = extractWarningDayData(parsedData, day);
          
          // Save to disk
          await storage.saveWarningData(year, month, day, leadDay, dayData);
          
          summary.daysProcessed++;
          summary.filesCreated++;
        } catch (error) {
          const errorMsg = `${leadDay} Day ${day}: ${error instanceof Error ? error.message : String(error)}`;
          summary.errors.push(errorMsg);
        }
      }
    }
    
    // Add summary message
    summary.warnings.push(
      `Processed all 5 lead days (D1-D5) from multi-sheet file`
    );
    
    // Add warning if some days failed
    if (summary.errors.length > 0) {
      summary.warnings.push(
        `${summary.errors.length} out of ${daysInMonth * 5} total day-lead combinations failed to process`
      );
    }
    
  } catch (error) {
    throw new Error(`Failed to process multi-sheet warning upload: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return summary;
}

