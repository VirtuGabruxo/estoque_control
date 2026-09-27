import { NextResponse } from 'next/server';
import { query, getPool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); // 'entrada', 'saida', 'tudo'
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let sql = `
      SELECT m.id, m.tipo, m.responsavel, m.funcionario_id, m.usuario_id, m.criado_em,
             f.nome as funcionario_nome
      FROM movimentacoes m
      LEFT JOIN funcionarios f ON f.id = m.funcionario_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tipo && tipo !== 'tudo') {
      params.push(tipo);
      sql += ` AND m.tipo = $${params.length}`;
    }

    sql += ` ORDER BY m.criado_em DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const movRes = await query(sql, params);
    const movements = movRes.rows;

    if (movements.length > 0) {
      const movIds = movements.map((m) => m.id);
      const itemsRes = await query(
        `SELECT mi.id, mi.movimentacao_id, mi.produto_id, mi.lote_id, mi.quantidade,
                mi.estoque_anterior, mi.estoque_atual,
                p.nome as produto_nome, p.codigo_barras,
                le.data_validade
         FROM movimentacao_itens mi
         JOIN produtos p ON p.id = mi.produto_id
         LEFT JOIN lotes_estoque le ON le.id = mi.lote_id
         WHERE mi.movimentacao_id = ANY($1::uuid[])
         ORDER BY mi.id ASC`,
        [movIds]
      );

      // Group items by movimentacao_id
      const itemsMap: Record<string, any[]> = {};
      for (const item of itemsRes.rows) {
        if (!itemsMap[item.movimentacao_id]) {
          itemsMap[item.movimentacao_id] = [];
        }
        itemsMap[item.movimentacao_id].push(item);
      }

      for (const m of movements) {
        m.itens = itemsMap[m.id] || [];
      }
    }

    return NextResponse.json(movements);
  } catch (error: any) {
    console.error('Error fetching movimentacoes:', error);
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
    const { tipo, responsavel, funcionario_id, itens } = body;

    if (!tipo || !responsavel || !itens || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json(
        { error: 'Tipo, responsável e itens são obrigatórios.' },
        { status: 400 }
      );
    }

    if (tipo !== 'entrada' && tipo !== 'saida') {
      return NextResponse.json({ error: 'Tipo deve ser "entrada" ou "saida".' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Create Movimentacao record
    const movRes = await client.query(
      `INSERT INTO movimentacoes (tipo, responsavel, funcionario_id, usuario_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, tipo, responsavel, criado_em`,
      [tipo, responsavel.trim(), funcionario_id || null, user.id]
    );
    const movId = movRes.rows[0].id;

    const resultados: any[] = [];

    // ==========================================
    // FLUXO DE ENTRADA
    // ==========================================
    if (tipo === 'entrada') {
      for (const item of itens) {
        let produtoId = item.produto_id;

        // Se o produto não tiver ID, busca por código de barras ou cria
        if (!produtoId && item.codigo_barras) {
          const findProd = await client.query(
            'SELECT id, nome, categoria_id FROM produtos WHERE codigo_barras = $1',
            [item.codigo_barras.trim()]
          );
          if (findProd.rows.length > 0) {
            produtoId = findProd.rows[0].id;
            // Se o usuário editou nome ou categoria no form de entrada, atualiza
            if (item.nome || item.categoria_id) {
              await client.query(
                `UPDATE produtos 
                 SET nome = COALESCE($1, nome),
                     categoria_id = COALESCE($2, categoria_id)
                 WHERE id = $3`,
                [item.nome?.trim(), item.categoria_id, produtoId]
              );
            }
          } else {
            // Primeiro cadastro deste código de barras
            if (!item.nome || !item.categoria_id) {
              throw new Error(`Produto novo com código "${item.codigo_barras}" requer nome e categoria.`);
            }
            const createProd = await client.query(
              `INSERT INTO produtos (nome, codigo_barras, categoria_id)
               VALUES ($1, $2, $3)
               RETURNING id`,
              [item.nome.trim(), item.codigo_barras.trim(), item.categoria_id]
            );
            produtoId = createProd.rows[0].id;
          }
        }

        if (!produtoId) {
          throw new Error('Produto não identificado para o item de entrada.');
        }

        if (!item.data_validade) {
          throw new Error(`Data de validade obrigatória para o produto "${item.nome || item.codigo_barras}".`);
        }

        const qtd = parseInt(item.quantidade, 10);
        if (isNaN(qtd) || qtd <= 0) {
          throw new Error(`Quantidade inválida para o produto "${item.nome || item.codigo_barras}".`);
        }

        // Estoque total anterior do produto
        const antRes = await client.query(
          `SELECT COALESCE(SUM(quantidade), 0)::int as total FROM lotes_estoque WHERE produto_id = $1`,
          [produtoId]
        );
        const estoqueTotalAnterior = antRes.rows[0]?.total || 0;

        // Verifica se já existe um lote com a mesma data de validade para este produto
        const loteExistente = await client.query(
          `SELECT id, quantidade FROM lotes_estoque WHERE produto_id = $1 AND data_validade = $2`,
          [produtoId, item.data_validade]
        );

        let loteId: string;
        if (loteExistente.rows.length > 0) {
          loteId = loteExistente.rows[0].id;
          await client.query(
            `UPDATE lotes_estoque SET quantidade = quantidade + $1 WHERE id = $2`,
            [qtd, loteId]
          );
        } else {
          const novoLote = await client.query(
            `INSERT INTO lotes_estoque (produto_id, data_validade, quantidade)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [produtoId, item.data_validade, qtd]
          );
          loteId = novoLote.rows[0].id;
        }

        const estoqueTotalAtual = estoqueTotalAnterior + qtd;

        // Registra item da movimentação
        await client.query(
          `INSERT INTO movimentacao_itens (movimentacao_id, produto_id, lote_id, quantidade, estoque_anterior, estoque_atual)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [movId, produtoId, loteId, qtd, estoqueTotalAnterior, estoqueTotalAtual]
        );

        resultados.push({
          produto_id: produtoId,
          produto_nome: item.nome,
          codigo_barras: item.codigo_barras,
          quantidade: qtd,
          estoque_anterior: estoqueTotalAnterior,
          estoque_atual: estoqueTotalAtual,
        });
      }
    }

    // ==========================================
    // FLUXO DE SAÍDA (FEFO)
    // ==========================================
    if (tipo === 'saida') {
      for (const item of itens) {
        let produtoId = item.produto_id;
        let produtoNome = item.nome;
        let codigoBarras = item.codigo_barras;

        if (!produtoId && codigoBarras) {
          const findProd = await client.query(
            'SELECT id, nome, codigo_barras FROM produtos WHERE codigo_barras = $1',
            [codigoBarras.trim()]
          );
          if (findProd.rows.length === 0) {
            throw new Error(`Produto com código "${codigoBarras}" não encontrado.`);
          }
          produtoId = findProd.rows[0].id;
          produtoNome = findProd.rows[0].nome;
        }

        const qtd = parseInt(item.quantidade, 10);
        if (isNaN(qtd) || qtd <= 0) {
          throw new Error(`Quantidade inválida para o produto "${produtoNome}".`);
        }

        // Calcula estoque total antes da saída
        const totalEstoqueRes = await client.query(
          `SELECT COALESCE(SUM(quantidade), 0)::int as total FROM lotes_estoque WHERE produto_id = $1`,
          [produtoId]
        );
        const estoqueTotalAnterior = totalEstoqueRes.rows[0]?.total || 0;

        if (estoqueTotalAnterior < qtd) {
          throw new Error(
            `Estoque insuficiente para "${produtoNome}". Solicitado: ${qtd}, Disponível: ${estoqueTotalAnterior}.`
          );
        }

        // Executa a saída FEFO usando a função do banco ou SQL direto
        const saidaProcessada = await client.query(
          `SELECT lote_id, estoque_anterior, estoque_atual, quantidade_subtraida 
           FROM processar_saida_estoque($1, $2)`,
          [produtoId, qtd]
        );

        for (const row of saidaProcessada.rows) {
          await client.query(
            `INSERT INTO movimentacao_itens (movimentacao_id, produto_id, lote_id, quantidade, estoque_anterior, estoque_atual)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [movId, produtoId, row.lote_id, row.quantidade_subtraida, row.estoque_anterior, row.estoque_atual]
          );
        }

        const estoqueTotalAtual = estoqueTotalAnterior - qtd;

        resultados.push({
          produto_id: produtoId,
          produto_nome: produtoNome,
          codigo_barras: codigoBarras,
          quantidade_saida: qtd,
          estoque_anterior: estoqueTotalAnterior,
          estoque_atual: estoqueTotalAtual,
        });
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      movimentacao_id: movId,
      tipo,
      responsavel,
      resultados,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error processing movimentacao:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar movimentação.' }, { status: 400 });
  } finally {
    client.release();
  }
}
