import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing report generation...');
    
    // Test database connection
    const salesCount = await prisma.sales.count();
    const inventoryCount = await prisma.inventory.count();
    
    console.log('Database counts:', { salesCount, inventoryCount });
    
    // Test email configuration
    const emailConfig = {
      gmailUser: process.env.GMAIL_USER ? 'Set' : 'Not set',
      gmailPassword: process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Not set',
      reportRecipient: process.env.REPORT_RECIPIENT || 'Not set',
      cronSecret: process.env.CRON_SECRET ? 'Set' : 'Not set',
    };
    
    console.log('Email config:', emailConfig);
    
    return NextResponse.json({
      success: true,
      message: 'Report test successful',
      database: {
        salesCount,
        inventoryCount,
      },
      emailConfig,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelUrl: process.env.VERCEL_URL,
      }
    });
    
  } catch (error) {
    console.error('Report test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
