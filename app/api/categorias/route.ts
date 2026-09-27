import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const res = await query(
      `SELECT c.id, c.nome, c.ativa, c.criado_em,
              COUNT(p.id)::int as total_produtos
       FROM categorias c
       LEFT JOIN produtos p ON p.categoria_id = c.id
       WHERE c.ativa = true
       GROUP BY c.id, c.nome, c.ativa, c.criado_em
       ORDER BY c.nome ASC`
    );

    return NextResponse.json(res.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
