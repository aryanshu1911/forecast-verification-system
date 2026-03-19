/**
 * API Route: Upload Realised Data
 * POST /api/upload/realised
 */

import { NextRequest, NextResponse } from 'next/server';
import { processRealisedUpload } from '@/app/utils/uploadProcessor';

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const year = parseInt(formData.get('year') as string, 10);
    const month = parseInt(formData.get('month') as string, 10);
    
    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (isNaN(year) || isNaN(month)) {
      return NextResponse.json(
        { success: false, error: 'Invalid year or month' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        { success: false, error: 'File must be an Excel file (.xlsx or .xls)' },
        { status: 400 }
      );
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Process upload
    const summary = await processRealisedUpload(buffer, { year, month });
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Realised data uploaded successfully',
      summary
    });
    
  } catch (error) {
    console.error('Realised upload error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      },
      { status: 500 }
    );
  }
}
