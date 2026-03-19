import { NextRequest, NextResponse } from 'next/server';
import {
  loadRainfallConfig,
  saveRainfallConfig,
  type RainfallConfig,
  type RainfallClassification
} from '@/app/utils/rainfallConfig';

// Admin password (in production, use environment variable)
const ADMIN_PASSWORD = 'admin123';

/**
 * GET /api/admin/rainfall-config
 * Fetch current rainfall classification configuration
 */
export async function GET(request: NextRequest) {
  try {
    const config = await loadRainfallConfig();
    
    return NextResponse.json({
      success: true,
      config
    });
  } catch (error: any) {
    console.error('Failed to load rainfall config:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load configuration',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/rainfall-config
 * Save updated rainfall classification configuration
 * Requires password authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, config } = body;
    
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
    
    // Validate config structure
    // if (!config || !config.classifications || !Array.isArray(config.classifications)) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: 'Invalid configuration structure'
    //     },
    //     { status: 400 }
    //   );
    // }
    
    // Validate each classification
    const errors: string[] = [];
    const thresholds = new Set<number>();
    
    for (let i = 0; i < config.classifications.length; i++) {
      const classification: RainfallClassification = config.classifications[i];
      
      // Validate required fields
      if (!classification.id || !classification.variableName) {
        errors.push(`Classification ${i + 1}: Missing id or variableName`);
      }
      
      // Validate threshold
      if (typeof classification.thresholdMm !== 'number' || classification.thresholdMm < 0) {
        errors.push(`Classification ${i + 1}: Threshold must be a non-negative number`);
      }
      
      // Check for duplicate thresholds
      if (thresholds.has(classification.thresholdMm)) {
        errors.push(`Classification ${i + 1}: Duplicate threshold ${classification.thresholdMm}mm`);
      }
      thresholds.add(classification.thresholdMm);
      
      // Validate codes array
      if (!Array.isArray(classification.codes)) {
        errors.push(`Classification ${i + 1}: Codes must be an array`);
      } else {
        for (const code of classification.codes) {
          if (!Number.isInteger(code) || code < 0) {
            errors.push(`Classification ${i + 1}: Code ${code} must be a non-negative integer`);
          }
        }
      }
      
      // Validate order
      if (typeof classification.order !== 'number') {
        errors.push(`Classification ${i + 1}: Order must be a number`);
      }
    }
    
    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: errors
        },
        { status: 400 }
      );
    }
    
    // Save configuration
    await saveRainfallConfig(config);
    
    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully',
      config
    });
    
  } catch (error: any) {
    console.error('Failed to save rainfall config:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save configuration',
        details: error.message
      },
      { status: 500 }
    );
  }
}
