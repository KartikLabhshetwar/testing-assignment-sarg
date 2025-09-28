import { NextRequest, NextResponse } from 'next/server';
import { generatePdfReport } from '@/lib/reportGenerator';
import { sendEmail } from '@/lib/emailService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ManualSendSchema = z.object({
  recipient: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipient } = ManualSendSchema.parse(body);
    
    console.log('Starting manual report generation...');
    
    const timestamp = new Date().toISOString();
    
    // Generate report data
    const reportData = await generateReportData();
    
    // Generate PDF
    const pdfBuffer = await generatePdfReport(reportData);
    
    // Send email
    const emailRecipient = recipient || process.env.REPORT_RECIPIENT || 'hello@sarg.io';
    const subject = `Manual Business Report - ${timestamp}`;
    
    const emailResult = await sendEmail({
      to: emailRecipient,
      subject,
      text: 'Please find the attached business report.',
      attachments: [{
        filename: `manual-report-${Date.now()}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });
    
    // Log the email send attempt
    await prisma.emailLogs.create({
      data: {
        to: emailRecipient,
        subject,
        status: emailResult.success ? 'sent' : 'failed',
        error: emailResult.error || null,
        timestamp: new Date()
      }
    });
    
    console.log(`✅ Manual report sent successfully to ${emailRecipient}`);
    
    return NextResponse.json({
      success: true,
      message: `Report sent successfully to ${emailRecipient}`,
      timestamp,
      recipient: emailRecipient
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

async function generateReportData() {
  const [salesData, inventoryData] = await Promise.all([
    prisma.sales.findMany({
      take: 100,
      orderBy: { order_date: 'desc' }
    }),
    prisma.inventory.findMany({
      take: 100,
      orderBy: { last_restocked: 'desc' }
    })
  ]);

  const totalSales = await prisma.sales.aggregate({
    _sum: { total_amount: true },
    _count: { id: true }
  });

  const lowStockItems = await prisma.inventory.findMany({
    where: {
      stock_quantity: {
        lte: 10 // Default reorder level threshold
      }
    }
  });

  return {
    salesData,
    inventoryData,
    summary: {
      totalSalesAmount: totalSales._sum.total_amount || 0,
      totalSalesCount: totalSales._count.id || 0,
      lowStockCount: lowStockItems.length
    },
    generatedAt: new Date().toISOString()
  };
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
