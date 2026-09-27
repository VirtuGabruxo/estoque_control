import { NextResponse } from 'next/server';
import { query, getPool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoriaId = searchParams.get('categoria_id');
    const codigoBarras = searchParams.get('codigo_barras');
    const q = searchParams.get('q');

    let sql = `
      SELECT p.id, p.nome, p.codigo_barras, p.categoria_id, c.nome as categoria_nome,
             p.criado_em, p.atualizado_em,
             COALESCE((SELECT SUM(le.quantidade) FROM lotes_estoque le WHERE le.produto_id = p.id AND le.quantidade > 0), 0)::int as estoque_total,
             (SELECT MIN(le.data_validade) FROM lotes_estoque le WHERE le.produto_id = p.id AND le.quantidade > 0) as proxima_validade
      FROM produtos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (categoriaId) {
      params.push(categoriaId);
      sql += ` AND p.categoria_id = $${params.length}`;
    }

    if (codigoBarras) {
      params.push(codigoBarras);
      sql += ` AND p.codigo_barras = $${params.length}`;
    }

    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (p.nome ILIKE $${params.length} OR p.codigo_barras ILIKE $${params.length})`;
    }

    sql += ` ORDER BY p.nome ASC`;

    const res = await query(sql, params);

    // If searching by single barcode, also fetch active lotes
    if (codigoBarras && res.rows.length > 0) {
      const prod = res.rows[0];
      const lotesRes = await query(
        `SELECT id, produto_id, data_validade, quantidade, criado_em 
         FROM lotes_estoque 
         WHERE produto_id = $1 AND quantidade > 0 
         ORDER BY data_validade ASC`,
        [prod.id]
      );
      prod.lotes = lotesRes.rows;
      return NextResponse.json(prod);
    }

    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Error fetching produtos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { nome, codigo_barras, categoria_id, data_validade, quantidade, responsavel } = body;

    if (!nome || !codigo_barras || !categoria_id) {
      return NextResponse.json(
        { error: 'Nome, código de barras e categoria são obrigatórios.' },
        { status: 400 }
      );
    }

    // Check if barcode already exists
    const checkRes = await client.query('SELECT id, nome FROM produtos WHERE codigo_barras = $1', [codigo_barras]);
    if (checkRes.rows.length > 0) {
      return NextResponse.json(
        { error: `Código de barras já vinculado ao produto "${checkRes.rows[0].nome}".` },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // 1. Insert product
    const prodRes = await client.query(
      `INSERT INTO produtos (nome, codigo_barras, categoria_id)
       VALUES ($1, $2, $3)
       RETURNING id, nome, codigo_barras, categoria_id, criado_em, atualizado_em`,
      [nome.trim(), codigo_barras.trim(), categoria_id]
    );
    const produto = prodRes.rows[0];

    // 2. If initial quantity and validade provided, create lot and movement
    const qtdNum = parseInt(quantidade, 10) || 0;
    if (qtdNum > 0 && data_validade) {
      const loteRes = await client.query(
        `INSERT INTO lotes_estoque (produto_id, data_validade, quantidade)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [produto.id, data_validade, qtdNum]
      );
      const loteId = loteRes.rows[0].id;

      // Register initial movement
      const movRes = await client.query(
        `INSERT INTO movimentacoes (tipo, responsavel, usuario_id)
         VALUES ('entrada', $1, $2)
         RETURNING id`,
        [responsavel || user.nome || 'Cadastro Manual', user.id]
      );
      const movId = movRes.rows[0].id;

      await client.query(
        `INSERT INTO movimentacao_itens (movimentacao_id, produto_id, lote_id, quantidade, estoque_anterior, estoque_atual)
         VALUES ($1, $2, $3, $4, 0, $4)`,
        [movId, produto.id, loteId, qtdNum]
      );
    }

    await client.query('COMMIT');
    return NextResponse.json(produto, { status: 201 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
