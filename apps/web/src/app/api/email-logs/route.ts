import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const logs = await prisma.emailLogs.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' }
    });

    return NextResponse.json({ 
      success: true, 
      logs 
    });

  } catch (error) {
    console.error('Failed to fetch email logs:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch email logs' 
    }, { status: 500 });
  }
}
