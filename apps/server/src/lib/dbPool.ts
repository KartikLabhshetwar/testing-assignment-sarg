import { Pool } from 'pg';
import opossum from 'opossum';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  min: 2,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => console.log('pg connected'));
pool.on('error', (err) => console.error('pg pool error', err));
pool.on('acquire', () => console.log('pg client acquired'));
pool.on('remove', () => console.log('pg client removed'));

export async function executeWithRetry(queryText: string, params: any[] = [], retries = 3) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const client = await pool.connect();
      try {
        const res = await client.query(queryText, params);
        client.release();
        return res;
      } catch (err) {
        client.release();
        throw err;
      }
    } catch (err) {
      attempt++;
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
}

const breakerOptions = {
  timeout: 30000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
};

export const dbBreaker = new opossum(executeWithRetry, breakerOptions);
dbBreaker.fallback(() => ({ rows: [], warning: 'db circuit open - returning empty result' }));
dbBreaker.on('open', () => console.warn('DB circuit opened'));
dbBreaker.on('halfOpen', () => console.log('DB circuit half-open'));
dbBreaker.on('close', () => console.log('DB circuit closed'));

export function getPoolStatus() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
}

export function getCircuitBreakerState() {
  return {
    isOpen: dbBreaker.opened,
    isHalfOpen: dbBreaker.halfOpen,
    stats: dbBreaker.stats
  };
}
