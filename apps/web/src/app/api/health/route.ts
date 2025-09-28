import { NextResponse } from 'next/server';
import { getPoolStatus, getCircuitBreakerState, pool } from '@/lib/dbPool';

export async function GET() {
  try {
    const poolStatus = getPoolStatus();
    const circuitStatus = getCircuitBreakerState();
    
    let dbConnected = false;
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      dbConnected = true;
    } catch (error) {
      console.error('Health check DB connection failed:', error);
    }

    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: {
        connected: dbConnected,
        pool: poolStatus,
        circuit: {
          state: circuitStatus.isOpen ? 'open' : circuitStatus.isHalfOpen ? 'half-open' : 'closed',
          stats: circuitStatus.stats
        }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}
