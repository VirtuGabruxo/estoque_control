const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.azeebasbdzsrjobmevjp:Xj8KU0XkvSJByYpe@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    // 1. Adicionar coluna ativo em clientes
    await client.query(`
      ALTER TABLE public.clientes
        ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true
    `);
    console.log('✓ Coluna "ativo" adicionada em clientes');

    // 2. Índice
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clientes_ativo
        ON public.clientes (ativo)
    `);
    console.log('✓ Índice criado');

    // 3. Verificar
    const check = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'clientes'
      ORDER BY ordinal_position
    `);
    console.log('\nColunas de clientes:');
    check.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}) default=${r.column_default}`));
    console.log('\n✅ Migration concluída!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
