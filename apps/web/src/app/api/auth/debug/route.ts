import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Test if auth is properly configured
    const session = await auth.api.getSession({
      headers: request.headers
    });

    return NextResponse.json({
      success: true,
      message: 'Auth is working',
      hasSession: !!session,
      session: session ? {
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email
        }
      } : null,
      config: {
        baseURL: process.env.BETTER_AUTH_URL || 'not set',
        nodeEnv: process.env.NODE_ENV,
        vercelUrl: process.env.VERCEL_URL || 'not set'
      }
    });
  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
