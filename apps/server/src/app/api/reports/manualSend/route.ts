import { NextRequest, NextResponse } from 'next/server';
import { generatePdfReport, sendEmailReport, generateReportSummary } from '@/lib/reportGenerator';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const ManualSendSchema = z.object({
  reportConfigId: z.string().optional(),
  recipient: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportConfigId, recipient } = ManualSendSchema.parse(body);
    
    console.log('Starting manual report generation...');
    
    const reportId = `manual-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    // Generate report summary
    const summary = await generateReportSummary();
    
    // For now, create a simple HTML report URL
    // In production, this would render based on reportConfigId
    const reportUrl = `${process.env.NEXTAUTH_URL}/reports/render?id=${reportId}&config=${reportConfigId || 'default'}`;
    
    // Generate PDF
    const pdfBuffer = await generatePdfReport(reportId, reportUrl);
    
    // Send email
    const emailRecipient = recipient || process.env.REPORT_RECIPIENT || 'hello@sarg.io';
    const subject = `Manual Business Report - ${timestamp}`;
    
    const emailResult = await sendEmailReport(emailRecipient, subject, pdfBuffer, summary);
    
    console.log(`✅ Manual report sent successfully to ${emailRecipient}`);
    
    return NextResponse.json({
      success: true,
      message: `Report sent successfully to ${emailRecipient}`,
      details: {
        reportId,
        timestamp,
        recipient: emailRecipient,
        emailId: emailResult.messageId,
        pdfSize: pdfBuffer.length
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to send manual report:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors 
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
    
    const recentLogs = await prisma.emailLogs.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
    
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
