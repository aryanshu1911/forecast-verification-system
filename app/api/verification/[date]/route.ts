import { NextRequest, NextResponse } from 'next/server';
import { compareForDate, calculateAccuracy } from '@/app/utils/comparisonEngine';
import { parseDate } from '@/app/utils/dateUtils';

/**
 * GET /api/verification/[date]
 * Lazy-loads verification data for a specific date
 * Calculates on-demand from file-based storage
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ date: string }> }
) {
  try {
    // Await params for Next.js 15+
    const { date } = await context.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Parse date - this is the SELECTED DATE (e.g., June 11)
    const { year, month, day } = parseDate(date);
    
    // NEW LOGIC:
    // - Realized data is always from SELECTED DATE + 1 (e.g., June 12)
    // - Warning data goes backwards from SELECTED DATE:
    //   D1 = Selected Date (June 11)
    //   D2 = Selected Date - 1 day (June 10)
    //   D3 = Selected Date - 2 days (June 9)
    //   D4 = Selected Date - 3 days (June 8)
    //   D5 = Selected Date - 4 days (June 7)
    
    // Calculate verification for all lead days
    const leadDays = ['D1', 'D2', 'D3', 'D4', 'D5'];
    const leadTimeResults: any = {};
    const allVerifications: any[] = [];
    
    for (let i = 0; i < leadDays.length; i++) {
      const leadDay = leadDays[i];
      const leadDayName = `day${i + 1}`;
      
  // WARNING SOURCE: use the SELECTED DATE for all leadDays (D1..D5)
  // i.e., load from data/warning/<leadDay>/<selectedDate>
  const warningYear = year;
  const warningMonth = month;
  const warningDay = day;

  const comparisons = await compareForDate(warningYear, warningMonth, warningDay, leadDay, year, month, day);
      const stats = calculateAccuracy(comparisons);
      
      // Format verifications for UI - use new comparison structure
      const verifications = comparisons.map(c => ({
        district: c.district,
        date: c.date,
        forecastCode: c.forecastCode,
        forecastClassification: c.forecastClassification,
        realisedRainfall: c.realisedRainfall,
        realisedClassification: c.realisedClassification,
        match: c.match,
        type: c.type
      }));
      
      leadTimeResults[leadDayName] = {
        verifications,
        statistics: {
          hits: stats.correct,
          misses: stats.missedEvents,
          falseAlarms: stats.falseAlarms,
          correctNegatives: stats.correctNonEvents,
          total: stats.totalPredictions,
          accuracy: stats.accuracy
        }
      };
      
      allVerifications.push(...verifications);
    }
    
    // Calculate overall statistics
    const allComparisons = [];
    for (let i = 0; i < leadDays.length; i++) {
      const leadDay = leadDays[i];
      
  // For overall stats also load warnings from the SELECTED DATE for each leadDay
  const warningYear = year;
  const warningMonth = month;
  const warningDay = day;

  const comparisons = await compareForDate(warningYear, warningMonth, warningDay, leadDay, year, month, day);
      allComparisons.push(...comparisons);
    }
    const overallStats = calculateAccuracy(allComparisons);
    
    const result = {
      success: true,
      date,
      cached: false, // TODO: Add caching later
      day1: leadTimeResults.day1,
      day2: leadTimeResults.day2,
      day3: leadTimeResults.day3,
      day4: leadTimeResults.day4,
      day5: leadTimeResults.day5,
      overall: {
        verifications: allVerifications,
        statistics: {
          hits: overallStats.correct,
          misses: overallStats.missedEvents,
          falseAlarms: overallStats.falseAlarms,
          correctNegatives: overallStats.correctNonEvents,
          total: overallStats.totalPredictions,
          accuracy: overallStats.accuracy
        }
      }
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Date verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get date verification',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
