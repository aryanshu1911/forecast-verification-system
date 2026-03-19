import { NextRequest, NextResponse } from 'next/server';
import { compareForDateRange, calculateAccuracy, getDistrictWiseAccuracy } from '@/app/utils/comparisonEngine';

/**
 * POST /api/verification/heavy-rainfall
 * Run heavy rainfall verification using file-based storage
 * 
 * Supports two modes:
 * 1. Overview mode (no selectedDay): Returns stats for all 5 lead days
 * 2. Detailed mode (with selectedDay): Returns district-wise stats for specific day
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { threshold = 64.5, startDate, endDate, selectedDay } = body;

    // Validate inputs
    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Mode 1: Detailed view for specific day
    if (selectedDay) {
      const leadDayCode = selectedDay; // Already in format "D1", "D2", etc.
      const comparisons = await compareForDateRange(startDate, endDate, leadDayCode);
      
      // Calculate district-wise statistics for this specific day
      const districtStats = getDistrictWiseAccuracy(comparisons);
      
      const districtWise: any = {};
      for (const [district, stats] of districtStats.entries()) {
        districtWise[district] = {
          H: stats.correct,
          M: stats.missedEvents,
          F: stats.falseAlarms,
          CN: stats.correctNonEvents,
          Total: stats.totalPredictions,
          POD: stats.pod,
          FAR: stats.far,
          CSI: stats.csi,
          Bias: stats.bias
        };
      }

      return NextResponse.json({
        success: true,
        threshold,
        start_date: startDate,
        end_date: endDate,
        selectedDay,
        district_wise: districtWise
      });
    }

    // Mode 2: Overview mode - stats for all 5 lead days
    const leadDays = ['Day-1', 'Day-2', 'Day-3', 'Day-4', 'Day-5'];
    const leadTimeResults: any = {};

    for (const leadDay of leadDays) {
      const leadDayCode = leadDay.replace('Day-', 'D');
      const comparisons = await compareForDateRange(startDate, endDate, leadDayCode);
      const stats = calculateAccuracy(comparisons);

      leadTimeResults[leadDay] = {
        scores: {
          H: stats.correct,
          M: stats.missedEvents,
          F: stats.falseAlarms,
          CN: stats.correctNonEvents,
          Total: stats.totalPredictions,
          POD: stats.pod,
          FAR: stats.far,
          CSI: stats.csi,
          Bias: stats.bias
        },
        count: stats.totalPredictions
      };
    }

    return NextResponse.json({
      success: true,
      threshold,
      start_date: startDate,
      end_date: endDate,
      lead_times: leadTimeResults
    });

  } catch (error: any) {
    console.error('Heavy rainfall verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to run verification',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

