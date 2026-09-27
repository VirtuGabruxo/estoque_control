import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    // ?inativos=true mostra apenas inativos; por padrão mostra apenas ativos
    const inativos = searchParams.get('inativos') === 'true';

    let sql = `
      SELECT c.id, c.nome, c.telefone, c.ativo, c.criado_em, c.atualizado_em,
             COALESCE(SUM(CASE WHEN lf.tipo = 'compra' AND lf.pago = false THEN lf.valor ELSE 0 END), 0)::numeric
               - COALESCE(SUM(CASE WHEN lf.tipo = 'pagamento' THEN lf.valor ELSE 0 END), 0)::numeric
               as total_divida,
             COUNT(lf.id)::int as total_compras
      FROM clientes c
      LEFT JOIN lancamentos_fiado lf ON lf.cliente_id = c.id
      WHERE c.ativo = $1
    `;
    const params: any[] = [!inativos];

    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (c.nome ILIKE $${params.length} OR c.telefone ILIKE $${params.length})`;
    }

    sql += ` GROUP BY c.id, c.nome, c.telefone, c.ativo, c.criado_em, c.atualizado_em
             ORDER BY total_divida DESC, c.nome ASC`;

    const res = await query(sql, params);
    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Error fetching clientes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { nome, telefone } = body;

    if (!nome) {
      return NextResponse.json({ error: 'Nome do cliente é obrigatório.' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO clientes (nome, telefone)
       VALUES ($1, $2)
       RETURNING id, nome, telefone, ativo, criado_em, atualizado_em`,
      [nome.trim(), telefone ? telefone.trim() : null]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating cliente:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/clientes → toggle ativo
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ativo } = body;

    if (!id || ativo === undefined) {
      return NextResponse.json({ error: 'id e ativo são obrigatórios.' }, { status: 400 });
    }

    const res = await query(
      `UPDATE clientes SET ativo = $1 WHERE id = $2
       RETURNING id, nome, telefone, ativo, criado_em, atualizado_em`,
      [!!ativo, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    console.error('Error toggling cliente ativo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
