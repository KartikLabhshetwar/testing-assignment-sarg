import { NextRequest, NextResponse } from 'next/server';
import { generatePdfReport } from '@/lib/reportGenerator';
import { sendEmail } from '@/lib/emailService';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify CRON_SECRET for security
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (authHeader !== expectedAuth) {
      console.error('Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Cron job started at:', new Date().toISOString());

    // Generate report data
    const reportData = await generateReportData();
    
    // Generate PDF
    const pdfBuffer = await generatePdfReport(reportData);
    
    // Send email
    const emailResult = await sendEmail({
      to: process.env.REPORT_RECIPIENT || 'hello@sarg.io',
      subject: `Hourly Business Report - ${new Date().toISOString()}`,
      attachments: [{
        filename: `business-report-${Date.now()}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });

    // Log the email send attempt
    await prisma.emailLogs.create({
      data: {
        to: process.env.REPORT_RECIPIENT || 'hello@sarg.io',
        subject: `Hourly Business Report - ${new Date().toISOString()}`,
        status: emailResult.success ? 'sent' : 'failed',
        error: emailResult.error || null,
        timestamp: new Date()
      }
    });

    console.log('Cron job completed successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Report sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron job failed:', error);
    
    // Try to log the error, but don't fail if logging fails
    try {
      await prisma.emailLogs.create({
        data: {
          to: process.env.REPORT_RECIPIENT || 'hello@sarg.io',
          subject: `Hourly Business Report - ${new Date().toISOString()}`,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
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
