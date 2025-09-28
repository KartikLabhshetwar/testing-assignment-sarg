import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ManualSendSchema = z.object({
  recipient: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipient } = ManualSendSchema.parse(body);
    
    console.log('Starting manual report generation...');
    
    // Call the cron endpoint to generate and send the report
    const cronUrl = new URL('/api/cron/sendReport', request.url);
    const cronResponse = await fetch(cronUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`,
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({ trigger: 'manual' }),
    });
    
    if (!cronResponse.ok) {
      const errorText = await cronResponse.text();
      console.error('Cron endpoint error:', cronResponse.status, errorText);
      throw new Error(`Cron endpoint failed: ${cronResponse.status} - ${errorText}`);
    }
    
    const cronResult = await cronResponse.json();
    
    if (!cronResult.success) {
      throw new Error(cronResult.error || 'Failed to generate report');
    }
    
    console.log(`✅ Manual report sent successfully`);
    
    return NextResponse.json({
      success: true,
      message: `Report sent successfully`,
      timestamp: cronResult.timestamp,
      summary: cronResult.summary,
    });
    
  } catch (error) {
    console.error('❌ Failed to send manual report:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.issues 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return recent email logs
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const { prisma } = await import('@/lib/prisma');
    
    // Try to fetch logs, handle missing timestamp column gracefully
    let recentLogs;
    try {
      recentLogs = await prisma.emailLogs.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
    } catch (dbError: any) {
      if (dbError.message?.includes('timestamp')) {
        // Fallback: fetch without ordering by timestamp
        recentLogs = await prisma.emailLogs.findMany({
          take: limit,
        });
      } else {
        throw dbError;
      }
    }
    
    return NextResponse.json({
      logs: recentLogs,
      summary: {
        total: recentLogs.length,
        successful: recentLogs.filter(log => log.status === 'sent').length,
        failed: recentLogs.filter(log => log.status === 'failed').length,
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch email logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
