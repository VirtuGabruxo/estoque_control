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

    let sql = `
      SELECT c.id, c.nome, c.telefone, c.criado_em, c.atualizado_em,
             COALESCE(SUM(CASE WHEN lf.pago = false THEN lf.valor ELSE 0 END), 0)::numeric as total_divida,
             COUNT(lf.id)::int as total_compras,
             COUNT(CASE WHEN lf.pago = false THEN 1 END)::int as compras_pendentes
      FROM clientes c
      LEFT JOIN lancamentos_fiado lf ON lf.cliente_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (c.nome ILIKE $${params.length} OR c.telefone ILIKE $${params.length})`;
    }

    sql += ` GROUP BY c.id, c.nome, c.telefone, c.criado_em, c.atualizado_em ORDER BY total_divida DESC, c.nome ASC`;

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
       RETURNING id, nome, telefone, criado_em, atualizado_em`,
      [nome.trim(), telefone ? telefone.trim() : null]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating cliente:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
