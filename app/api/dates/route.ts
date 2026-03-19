import { NextRequest, NextResponse } from 'next/server';
import { getAvailableDates } from '@/app/utils/unifiedDataLoader';

/**
 * GET /api/dates?year=2025&month=6
 * Returns available dates for a specific month from file-based storage
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get('year') || '2025');
    const month = parseInt(searchParams.get('month') || '6');
    
    // Get available dates from file storage
    const dates = await getAvailableDates(year, month);
    
    // Format dates with accuracy info (no cache yet, will add later)
    const datesWithAccuracy = dates.map(date => ({
      date,
      accuracy: null, // TODO: Add verification cache
      cached: false
    }));

    return NextResponse.json({
      success: true,
      year,
      month,
      dates: datesWithAccuracy,
      total: dates.length
    });

  } catch (error: any) {
    console.error('Dates error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get dates',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
