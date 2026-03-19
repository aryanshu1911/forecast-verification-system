/**
 * API endpoint for managing rainfall classification mode
 * GET: Returns current mode and available labels
 * POST: Switches between dual and multi modes
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  loadRainfallConfig, 
  switchMode, 
  getPublicClassificationInfo 
} from '@/app/utils/rainfallConfig';

/**
 * GET /api/rainfall-mode
 * Returns current classification mode and available labels
 */
export async function GET() {
  try {
    const info = await getPublicClassificationInfo();
    return NextResponse.json(info);
  } catch (error: any) {
    console.error('Error getting rainfall mode:', error);
    return NextResponse.json(
      { error: 'Failed to get rainfall mode' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rainfall-mode
 * Switches between dual and multi classification modes
 * Body: { mode: 'dual' | 'multi' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode } = body;
    
    if (!mode || (mode !== 'dual' && mode !== 'multi')) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "dual" or "multi"' },
        { status: 400 }
      );
    }
    
    const updatedConfig = await switchMode(mode);
    const info = await getPublicClassificationInfo();
    
    return NextResponse.json({
      success: true,
      mode: updatedConfig.mode,
      availableLabels: info.availableLabels
    });
  } catch (error: any) {
    console.error('Error switching rainfall mode:', error);
    return NextResponse.json(
      { error: 'Failed to switch mode: ' + error.message },
      { status: 500 }
    );
  }
}
