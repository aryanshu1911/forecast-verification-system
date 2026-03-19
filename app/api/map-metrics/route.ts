import { NextRequest, NextResponse } from 'next/server';
import { compareForDateRange, getDistrictWiseAccuracy } from '@/app/utils/comparisonEngine';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const leadDay = searchParams.get('leadDay') || 'D1';

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Get comparisons for the date range and lead day
    const comparisons = await compareForDateRange(startDate, endDate, leadDay);
    
    // Calculate district-wise statistics
    const districtStats = getDistrictWiseAccuracy(comparisons);
    
    const districts: Record<string, any> = {};
    for (const [district, stats] of districtStats.entries()) {
      districts[district] = {
        pod: stats.pod,
        far: stats.far,
        csi: stats.csi,
        bias: stats.bias,
        accuracy: stats.accuracy,
        total: stats.totalPredictions
      };
    }

    return NextResponse.json({
      success: true,
      startDate,
      endDate,
      leadDay,
      districts
    });

  } catch (error: any) {
    console.error('Map metrics API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
