import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.azeebasbdzsrjobmevjp:Xj8KU0XkvSJByYpe@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  const p = getPool();
  const start = Date.now();
  const res = await p.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development' && duration > 500) {
    console.log('Executed query', { text: text.slice(0, 80), duration, rows: res.rowCount });
  }
  return { rows: res.rows, rowCount: res.rowCount || 0 };
}
