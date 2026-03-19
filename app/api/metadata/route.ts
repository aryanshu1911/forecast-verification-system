import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

/**
 * GET /api/metadata
 * Returns metadata about available data in file-based storage
 */
export async function GET(request: NextRequest) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    
    // Check if data directory exists
    try {
      await fs.access(dataDir);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'No data directory found. Please upload data first.',
        hasData: false
      });
    }
    
    // Check for warning and realised data
    const warningDir = path.join(dataDir, 'warning');
    const realisedDir = path.join(dataDir, 'realised');
    
    let hasWarningData = false;
    let hasRealisedData = false;
    const availableMonths: any = {
      forecast: [],
      realised: []
    };
    
    
    // Scan warning directory (has D1-D5 subdirectories)
    try {
      const warningYears = await fs.readdir(warningDir);
      for (const year of warningYears) {
        if (year.startsWith('.')) continue;
        const yearPath = path.join(warningDir, year);
        const stat = await fs.stat(yearPath);
        if (!stat.isDirectory()) continue;
        
        const months = await fs.readdir(yearPath);
        for (const month of months) {
          if (month.startsWith('.')) continue;
          const monthPath = path.join(yearPath, month);
          const monthStat = await fs.stat(monthPath);
          if (!monthStat.isDirectory()) continue;
          
          // Check if this month directory has D1-D5 subdirectories (warning data)
          try {
            const leadDays = await fs.readdir(monthPath);
            const hasLeadDays = leadDays.some(d => d.match(/^D[1-5]$/));
            if (hasLeadDays) {
              availableMonths.forecast.push(`${year}-${month.padStart(2, '0')}`);
              hasWarningData = true;
            }
          } catch (err) {
            // Skip if can't read month directory
          }
        }
      }
    } catch (error) {
      console.log('Warning directory scan error:', error);
      // Warning directory doesn't exist or is empty
    }
    
    // Scan realised directory
    try {
      const realisedYears = await fs.readdir(realisedDir);
      for (const year of realisedYears) {
        if (year.startsWith('.')) continue;
        const yearPath = path.join(realisedDir, year);
        const stat = await fs.stat(yearPath);
        if (!stat.isDirectory()) continue;
        
        const months = await fs.readdir(yearPath);
        for (const month of months) {
          if (month.startsWith('.')) continue;
          const monthPath = path.join(yearPath, month);
          const monthStat = await fs.stat(monthPath);
          if (!monthStat.isDirectory()) continue;
          
          availableMonths.realised.push(`${year}-${month.padStart(2, '0')}`);
          hasRealisedData = true;
        }
      }
    } catch (error) {
      console.log('Realised directory scan error:', error);
      // Realised directory doesn't exist or is empty
    }
    
    const hasData = hasWarningData || hasRealisedData;
    
    if (!hasData) {
      return NextResponse.json({
        success: false,
        error: 'No data uploaded yet. Please upload IMD files first.',
        hasData: false
      });
    }
    
    return NextResponse.json({
      success: true,
      hasData: true,
      metadata: {
        uploads: availableMonths
      },
      availableMonths,
      cachedVerifications: 0, // TODO: Add verification cache
      summary: {
        forecastMonths: availableMonths.forecast.length,
        realisedMonths: availableMonths.realised.length,
        cachedDates: 0
      }
    });
    
  } catch (error: any) {
    console.error('Metadata error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get metadata',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
