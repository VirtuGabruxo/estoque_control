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

    // 1. Estoque Total
    const estoqueTotalRes = await query<{ total: number }>(
      `SELECT COALESCE(SUM(quantidade), 0)::int as total FROM lotes_estoque WHERE quantidade > 0`
    );
    const estoqueTotal = estoqueTotalRes.rows[0]?.total || 0;

    // 2. Produtos recentes (cadastrados recentemente)
    const produtosRecentesRes = await query(
      `SELECT p.id, p.nome, p.codigo_barras, c.nome as categoria_nome, p.criado_em,
              COALESCE((SELECT SUM(le.quantidade) FROM lotes_estoque le WHERE le.produto_id = p.id AND le.quantidade > 0), 0)::int as estoque_atual,
              (SELECT MIN(le.data_validade) FROM lotes_estoque le WHERE le.produto_id = p.id AND le.quantidade > 0) as proxima_validade
       FROM produtos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       ORDER BY p.criado_em DESC
       LIMIT 6`
    );

    // 3. Vencimentos por dia da semana (próximos 7 dias)
    const diasSemanaNomes = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const vencimentosPorDiaRes = await query<{
      dia_num: number;
      data_str: string;
      quantidade: number;
    }>(
      `SELECT 
         EXTRACT(ISODOW FROM data_validade)::int as dia_num,
         data_validade::text as data_str,
         SUM(quantidade)::int as quantidade
       FROM lotes_estoque
       WHERE quantidade > 0
         AND data_validade BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '6 days')
       GROUP BY dia_num, data_validade
       ORDER BY data_validade ASC`
    );

    // Build structured 7-day array
    const hoje = new Date();
    const graficoDias = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      const diaNum = d.getDay() === 0 ? 7 : d.getDay(); // 1 = Mon, 7 = Sun
      const nomeDia = diasSemanaNomes[diaNum - 1];
      const match = vencimentosPorDiaRes.rows.find((r) => r.data_str === isoDate);
      
      graficoDias.push({
        data: isoDate,
        dia: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : nomeDia,
        diaCompleto: `${nomeDia} (${d.getDate()}/${d.getMonth() + 1})`,
        quantidade: match ? match.quantidade : 0,
      });
    }

    // 4. Indicador: Produtos vencendo nos próximos 7 dias
    const vencendo7DiasRes = await query<{
      produtos_count: number;
      unidades: number;
    }>(
      `SELECT 
         COUNT(DISTINCT produto_id)::int as produtos_count,
         COALESCE(SUM(quantidade), 0)::int as unidades
       FROM lotes_estoque
       WHERE quantidade > 0
         AND data_validade BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')`
    );

    // 5. Produtos críticos vencendo nos próximos 7 dias (lista)
    const listaCriticosRes = await query(
      `SELECT p.id, p.nome, p.codigo_barras, c.nome as categoria_nome, le.data_validade, le.quantidade
       FROM lotes_estoque le
       JOIN produtos p ON p.id = le.produto_id
       LEFT JOIN categorias c ON c.id = p.categoria_id
       WHERE le.quantidade > 0
         AND le.data_validade BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')
       ORDER BY le.data_validade ASC
       LIMIT 5`
    );

    // 6. Movimentações de hoje (entradas vs saídas)
    const movHojeRes = await query<{
      tipo: string;
      total_movimentacoes: number;
      total_itens: number;
    }>(
      `SELECT 
         m.tipo,
         COUNT(DISTINCT m.id)::int as total_movimentacoes,
         COALESCE(SUM(mi.quantidade), 0)::int as total_itens
       FROM movimentacoes m
       LEFT JOIN movimentacao_itens mi ON mi.movimentacao_id = m.id
       WHERE DATE(m.criado_em) = CURRENT_DATE
       GROUP BY m.tipo`
    );

    let entradasHoje = 0;
    let saidasHoje = 0;
    for (const row of movHojeRes.rows) {
      if (row.tipo === 'entrada') entradasHoje = row.total_itens;
      if (row.tipo === 'saida') saidasHoje = row.total_itens;
    }

    // 7. Top categorias com mais itens
    const topCategoriasRes = await query(
      `SELECT c.id, c.nome, 
              COALESCE(SUM(le.quantidade), 0)::int as total_unidades,
              COUNT(DISTINCT p.id)::int as total_produtos
       FROM categorias c
       LEFT JOIN produtos p ON p.categoria_id = c.id
       LEFT JOIN lotes_estoque le ON le.produto_id = p.id AND le.quantidade > 0
       WHERE c.ativa = true
       GROUP BY c.id, c.nome
       ORDER BY total_unidades DESC
       LIMIT 5`
    );

    return NextResponse.json({
      estoqueTotal,
      produtosRecentes: produtosRecentesRes.rows,
      graficoDias,
      vencendo7Dias: vencendo7DiasRes.rows[0] || { produtos_count: 0, unidades: 0 },
      listaCriticos: listaCriticosRes.rows,
      movimentacoesHoje: {
        entradas: entradasHoje,
        saidas: saidasHoje,
      },
      topCategorias: topCategoriasRes.rows,
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
