import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 1. Run database function to check and generate notifications for items expiring today or in 2 days
    try {
      await query(`SELECT gerar_notificacoes_validade()`);
    } catch (fnErr) {
      console.warn('Note on gerar_notificacoes_validade:', fnErr);
    }

    // 2. Fetch notifications
    const res = await query(
      `SELECT id, tipo, titulo, mensagem, lida, dados, criado_em
       FROM notificacoes
       ORDER BY criado_em DESC
       LIMIT 40`
    );

    const naoLidas = res.rows.filter((n) => !n.lida).length;

    return NextResponse.json({
      notificacoes: res.rows,
      totalNaoLidas: naoLidas,
    });
  } catch (error: any) {
    console.error('Error in notificacoes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, marcar_todas } = body;

    if (marcar_todas) {
      await query(`UPDATE notificacoes SET lida = true WHERE lida = false`);
      return NextResponse.json({ success: true });
    }

    if (id) {
      await query(`UPDATE notificacoes SET lida = true WHERE id = $1`, [id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Parâmetro inválido' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
