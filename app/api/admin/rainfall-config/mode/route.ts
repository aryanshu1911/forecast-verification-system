import { NextRequest, NextResponse } from 'next/server';
import { switchMode, loadRainfallConfig } from '@/app/utils/rainfallConfig';

// Admin password
const ADMIN_PASSWORD = 'admin123';

/**
 * POST /api/admin/rainfall-config/mode
 * Switch between dual and multi mode
 * Requires password authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, mode } = body;
    
    // Validate password
    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid password'
        },
        { status: 401 }
      );
    }
    
    // Validate mode
    if (!mode || (mode !== 'dual' && mode !== 'multi')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid mode. Must be "dual" or "multi"'
        },
        { status: 400 }
      );
    }
    
    // Switch mode
    const updatedConfig = await switchMode(mode);
    
    return NextResponse.json({
      success: true,
      message: `Switched to ${mode} mode successfully`,
      config: updatedConfig
    });
    
  } catch (error: any) {
    console.error('Failed to switch mode:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to switch mode',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/rainfall-config/mode
 * Get current mode
 */
export async function GET(request: NextRequest) {
  try {
    const config = await loadRainfallConfig();
    
    return NextResponse.json({
      success: true,
      mode: config.mode
    });
  } catch (error: any) {
    console.error('Failed to get mode:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get mode',
        details: error.message
      },
      { status: 500 }
    );
  }
}
