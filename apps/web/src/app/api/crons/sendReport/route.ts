import { NextRequest, NextResponse } from 'next/server';
import cron from 'node-cron';
import { generatePdfReport, sendEmailReport, generateReportSummary } from '@/lib/reportGenerator';

let cronJob: cron.ScheduledTask | null = null;

async function sendHourlyReport() {
  try {
    console.log('Starting hourly report generation...');
    
    const reportId = `hourly-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    // Generate report summary
    const summary = await generateReportSummary();
    
    // Create HTML report URL
    const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
    const reportUrl = `${baseUrl}/reports/render?id=${reportId}`;
    
    console.log('Report URL:', reportUrl);
    
    // Generate PDF
    const pdfBuffer = await generatePdfReport(reportId, reportUrl);
    
    // Send email
    const recipient = process.env.REPORT_RECIPIENT || 'hello@sarg.io';
    const subject = `Hourly Business Report - ${timestamp}`;
    
    await sendEmailReport(recipient, subject, pdfBuffer, summary);
    
    console.log(`✅ Hourly report sent successfully to ${recipient}`);
    return { success: true, timestamp, recipient };
    
  } catch (error) {
    console.error('❌ Failed to send hourly report:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Initialize cron job when this module loads
if (!cronJob) {
  cronJob = cron.schedule('0 * * * *', sendHourlyReport, {
    scheduled: false, // Don't start automatically
    timezone: 'UTC'
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  try {
    switch (action) {
      case 'start':
        if (cronJob && !cronJob.running) {
          cronJob.start();
          return NextResponse.json({ 
            message: 'CRON job started successfully',
            schedule: '0 * * * * (every hour at minute 0)'
          });
        }
        return NextResponse.json({ message: 'CRON job is already running' });
        
      case 'stop':
        if (cronJob && cronJob.running) {
          cronJob.stop();
          return NextResponse.json({ message: 'CRON job stopped successfully' });
        }
        return NextResponse.json({ message: 'CRON job is not running' });
        
      case 'status':
        return NextResponse.json({
          running: cronJob?.running || false,
          schedule: '0 * * * *',
          nextRun: null // node-cron doesn't provide next run time
        });
        
      case 'test':
        const result = await sendHourlyReport();
        return NextResponse.json({
          message: 'Test report execution completed',
          result
        });
        
      default:
        return NextResponse.json({
          message: 'CRON job endpoint',
          availableActions: ['start', 'stop', 'status', 'test'],
          currentStatus: cronJob?.running || false
        });
    }
  } catch (error) {
    console.error('CRON job error:', error);
    return NextResponse.json(
      { error: 'CRON job operation failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'manual-send') {
      const result = await sendHourlyReport();
      return NextResponse.json({
        message: 'Manual report send completed',
        result
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Manual report send error:', error);
    return NextResponse.json(
      { error: 'Failed to send report manually' },
      { status: 500 }
    );
  }
}
