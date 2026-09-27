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
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes'); // YYYY-MM

    // 1. Get client info
    const clientRes = await query(
      `SELECT id, nome, telefone, criado_em, atualizado_em FROM clientes WHERE id = $1`,
      [id]
    );

    if (clientRes.rows.length === 0) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const cliente = clientRes.rows[0];

    // 2. Query all lancamentos (compras + pagamentos) with optional month filter
    let sql = `
      SELECT id, cliente_id, tipo, descricao, nome_comprador, data_compra,
             quantidade, valor, pago, forma_pagamento, criado_em, atualizado_em
      FROM lancamentos_fiado
      WHERE cliente_id = $1
    `;
    const queryParams: any[] = [id];

    if (mes) {
      queryParams.push(`${mes}-01`);
      sql += ` AND data_compra >= $2::date AND data_compra < ($2::date + INTERVAL '1 month')`;
    }

    sql += ` ORDER BY data_compra DESC, criado_em DESC`;

    const purchasesRes = await query(sql, queryParams);

    // 3. Dívida total = soma de compras não pagas - soma de pagamentos
    const totalDividaRes = await query<{ total: string }>(
      `SELECT (
         COALESCE(SUM(CASE WHEN tipo = 'compra' AND pago = false THEN valor ELSE 0 END), 0)
         - COALESCE(SUM(CASE WHEN tipo = 'pagamento' THEN valor ELSE 0 END), 0)
       )::numeric as total
       FROM lancamentos_fiado
       WHERE cliente_id = $1`,
      [id]
    );

    let dividaMesFiltrado = 0;
    if (mes) {
      const dividaMesRes = await query<{ total: string }>(
        `SELECT (
           COALESCE(SUM(CASE WHEN tipo = 'compra' AND pago = false THEN valor ELSE 0 END), 0)
           - COALESCE(SUM(CASE WHEN tipo = 'pagamento' THEN valor ELSE 0 END), 0)
         )::numeric as total
         FROM lancamentos_fiado
         WHERE cliente_id = $1
           AND data_compra >= $2::date AND data_compra < ($2::date + INTERVAL '1 month')`,
        [id, `${mes}-01`]
      );
      dividaMesFiltrado = Math.max(0, Number(dividaMesRes.rows[0]?.total || 0));
    }

    return NextResponse.json({
      cliente,
      compras: purchasesRes.rows,
      somatorioDividaGeral: Math.max(0, Number(totalDividaRes.rows[0]?.total || 0)),
      somatorioDividaMes: dividaMesFiltrado,
    });
  } catch (error: any) {
    console.error('Error fetching client purchases:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: single item OR batch of items (itens: []) OR pagamento
export async function POST(
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

    // ── PAGAMENTO ─────────────────────────────────────────────────────────────
    if (body.tipo === 'pagamento') {
      const { valor, data_compra, forma_pagamento, descricao } = body;
      if (!valor || Number(valor) <= 0) {
        return NextResponse.json({ error: 'Valor do pagamento inválido.' }, { status: 400 });
      }

      const res = await query(
        `INSERT INTO lancamentos_fiado
           (cliente_id, tipo, descricao, data_compra, quantidade, valor, pago, forma_pagamento)
         VALUES ($1, 'pagamento', $2, COALESCE($3::date, CURRENT_DATE), 1, $4, true, $5)
         RETURNING *`,
        [
          id,
          descricao?.trim() || 'Pagamento recebido',
          data_compra || null,
          parseFloat(valor),
          forma_pagamento || 'Dinheiro',
        ]
      );

      return NextResponse.json(res.rows[0], { status: 201 });
    }

    // ── BATCH DE ITENS (venda multi-produto) ──────────────────────────────────
    if (Array.isArray(body.itens) && body.itens.length > 0) {
      const { itens, data_compra, nome_comprador, pago, forma_pagamento } = body;

      const inserted: any[] = [];
      for (const item of itens) {
        if (!item.descricao || !item.valor) continue;
        const res = await query(
          `INSERT INTO lancamentos_fiado
             (cliente_id, tipo, descricao, nome_comprador, data_compra, quantidade, valor, pago, forma_pagamento)
           VALUES ($1, 'compra', $2, $3, COALESCE($4::date, CURRENT_DATE), $5, $6, $7, $8)
           RETURNING *`,
          [
            id,
            item.descricao.trim(),
            nome_comprador?.trim() || null,
            data_compra || null,
            parseInt(item.quantidade, 10) || 1,
            parseFloat(item.valor),
            pago === true,
            forma_pagamento || null,
          ]
        );
        inserted.push(res.rows[0]);
      }

      return NextResponse.json(inserted, { status: 201 });
    }

    // ── SINGLE ITEM (compatibilidade retroativa / edição) ─────────────────────
    const { descricao, nome_comprador, data_compra, quantidade, valor, pago, forma_pagamento } = body;

    if (!descricao || valor === undefined) {
      return NextResponse.json(
        { error: 'Descrição e valor são obrigatórios.' },
        { status: 400 }
      );
    }

    const res = await query(
      `INSERT INTO lancamentos_fiado
         (cliente_id, tipo, descricao, nome_comprador, data_compra, quantidade, valor, pago, forma_pagamento)
       VALUES ($1, 'compra', $2, $3, COALESCE($4::date, CURRENT_DATE), COALESCE($5, 1), $6, COALESCE($7, false), $8)
       RETURNING *`,
      [
        id,
        descricao.trim(),
        nome_comprador?.trim() || null,
        data_compra || null,
        parseInt(quantidade, 10) || 1,
        parseFloat(valor),
        pago === true,
        forma_pagamento || null,
      ]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating purchase:', error);
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
    const {
      id: lancamentoId,
      descricao,
      nome_comprador,
      data_compra,
      quantidade,
      valor,
      pago,
      forma_pagamento,
    } = body;

    if (!lancamentoId) {
      return NextResponse.json({ error: 'ID do lançamento é obrigatório.' }, { status: 400 });
    }

    const res = await query(
      `UPDATE lancamentos_fiado
       SET descricao        = COALESCE($1, descricao),
           nome_comprador   = $2,
           data_compra      = COALESCE($3::date, data_compra),
           quantidade       = COALESCE($4, quantidade),
           valor            = COALESCE($5, valor),
           pago             = COALESCE($6, pago),
           forma_pagamento  = COALESCE($7, forma_pagamento)
       WHERE id = $8 AND cliente_id = $9
       RETURNING *`,
      [
        descricao?.trim() || null,
        nome_comprador?.trim() || null,
        data_compra || null,
        quantidade !== undefined ? parseInt(quantidade, 10) : null,
        valor !== undefined ? parseFloat(valor) : null,
        pago !== undefined ? pago : null,
        forma_pagamento || null,
        lancamentoId,
        id,
      ]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Lançamento não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    console.error('Error updating purchase:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const purchaseId = searchParams.get('purchase_id');

    if (!purchaseId) {
      return NextResponse.json({ error: 'ID do lançamento obrigatório.' }, { status: 400 });
    }

    await query(
      `DELETE FROM lancamentos_fiado WHERE id = $1 AND cliente_id = $2`,
      [purchaseId, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
