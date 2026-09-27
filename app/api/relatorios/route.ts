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
    const modo = searchParams.get('modo') || 'geral'; // 'geral' | 'validade'
    const dias = searchParams.get('dias'); // '7', '15', '30', '60', '90'
    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');
    const categoriaId = searchParams.get('categoria_id');

    // MODO 1: Relatório por Prazo de Validade (Itens mais próximos do vencimento primeiro - FEFO)
    if (modo === 'validade') {
      let sql = `
        SELECT 
          le.id as lote_id,
          le.data_validade,
          le.quantidade,
          le.criado_em as lote_criado_em,
          p.id as produto_id,
          p.nome as produto_nome,
          p.codigo_barras,
          c.id as categoria_id,
          c.nome as categoria_nome,
          (le.data_validade - CURRENT_DATE) as dias_ate_vencimento
        FROM lotes_estoque le
        JOIN produtos p ON p.id = le.produto_id
        LEFT JOIN categorias c ON c.id = p.categoria_id
        WHERE le.quantidade > 0
      `;
      const params: any[] = [];

      if (categoriaId && categoriaId !== 'todas') {
        params.push(categoriaId);
        sql += ` AND p.categoria_id = $${params.length}`;
      }

      if (dias) {
        params.push(parseInt(dias, 10));
        sql += ` AND le.data_validade <= (CURRENT_DATE + ($${params.length} || ' days')::interval)`;
      } else if (dataInicio && dataFim) {
        params.push(dataInicio);
        params.push(dataFim);
        sql += ` AND le.data_validade BETWEEN $${params.length - 1} AND $${params.length}`;
      }

      sql += ` ORDER BY le.data_validade ASC, p.nome ASC`;

      const res = await query(sql, params);
      return NextResponse.json({
        modo: 'validade',
        totalItens: res.rows.length,
        dados: res.rows,
      });
    }

    // MODO 2: Relatório Geral (Movimentações de entradas e saídas no período)
    let sql = `
      SELECT 
        mi.id as item_id,
        m.id as movimentacao_id,
        m.tipo,
        m.responsavel,
        m.criado_em as data_hora,
        p.id as produto_id,
        p.nome as produto_nome,
        p.codigo_barras,
        c.nome as categoria_nome,
        mi.quantidade,
        mi.estoque_anterior,
        mi.estoque_atual,
        le.data_validade
      FROM movimentacao_itens mi
      JOIN movimentacoes m ON m.id = mi.movimentacao_id
      JOIN produtos p ON p.id = mi.produto_id
      LEFT JOIN categorias c ON c.id = p.categoria_id
      LEFT JOIN lotes_estoque le ON le.id = mi.lote_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (categoriaId && categoriaId !== 'todas') {
      params.push(categoriaId);
      sql += ` AND p.categoria_id = $${params.length}`;
    }

    if (dias) {
      params.push(parseInt(dias, 10));
      sql += ` AND m.criado_em >= (NOW() - ($${params.length} || ' days')::interval)`;
    } else if (dataInicio && dataFim) {
      params.push(`${dataInicio} 00:00:00`);
      params.push(`${dataFim} 23:59:59`);
      sql += ` AND m.criado_em BETWEEN $${params.length - 1} AND $${params.length}`;
    }

    sql += ` ORDER BY m.criado_em DESC, mi.id ASC`;

    const res = await query(sql, params);

    // Sum totals
    let totalEntradas = 0;
    let totalSaidas = 0;
    for (const r of res.rows) {
      if (r.tipo === 'entrada') totalEntradas += r.quantidade;
      if (r.tipo === 'saida') totalSaidas += r.quantidade;
    }

    return NextResponse.json({
      modo: 'geral',
      resumo: {
        totalMovimentacoes: res.rows.length,
        totalEntradas,
        totalSaidas,
      },
      dados: res.rows,
    });
  } catch (error: any) {
    console.error('Error in relatorios:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
