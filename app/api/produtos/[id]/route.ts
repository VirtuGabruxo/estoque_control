import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;

    const prodRes = await query(
      `SELECT p.id, p.nome, p.codigo_barras, p.categoria_id, c.nome as categoria_nome,
              p.criado_em, p.atualizado_em,
              COALESCE((SELECT SUM(le.quantidade) FROM lotes_estoque le WHERE le.produto_id = p.id AND le.quantidade > 0), 0)::int as estoque_total
       FROM produtos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE p.id = $1`,
      [id]
    );

    if (prodRes.rows.length === 0) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    const produto = prodRes.rows[0];

    const lotesRes = await query(
      `SELECT id, data_validade, quantidade, criado_em, atualizado_em
       FROM lotes_estoque
       WHERE produto_id = $1 AND quantidade > 0
       ORDER BY data_validade ASC`,
      [id]
    );

    produto.lotes = lotesRes.rows;
    return NextResponse.json(produto);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { nome, categoria_id } = body;

    const res = await query(
      `UPDATE produtos
       SET nome = COALESCE($1, nome),
           categoria_id = COALESCE($2, categoria_id)
       WHERE id = $3
       RETURNING *`,
      [nome?.trim(), categoria_id, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
