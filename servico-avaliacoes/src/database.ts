import pg from 'pg';

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

type Seed = (client: pg.PoolClient) => Promise<void>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Cria o schema (idempotente) com retry; lock consultivo evita corrida entre réplicas. */
export async function initDatabase(schema: string, seed?: Seed): Promise<void> {
  for (let tentativa = 1; ; tentativa++) {
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT pg_advisory_lock(727)');
        await client.query(schema);
        if (seed) await seed(client);
      } finally {
        await client.query('SELECT pg_advisory_unlock(727)').catch(() => undefined);
        client.release();
      }
      console.log('[DB] Schema pronto.');
      return;
    } catch (err) {
      if (tentativa >= 30) throw err;
      console.log(`[DB] Aguardando PostgreSQL (tentativa ${tentativa})...`);
      await sleep(2000);
    }
  }
}
