import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Try to fetch logs, handle missing timestamp column gracefully
    let logs;
    try {
      logs = await prisma.emailLogs.findMany({
        take: limit,
        orderBy: { timestamp: 'desc' }
      });
    } catch (dbError: any) {
      if (dbError.message?.includes('timestamp')) {
        // Fallback: fetch without ordering by timestamp
        logs = await prisma.emailLogs.findMany({
          take: limit,
        });
      } else {
        throw dbError;
      }
    }

    return NextResponse.json({ 
      success: true, 
      logs 
    });

  } catch (error) {
    console.error('Failed to fetch email logs:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch email logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
