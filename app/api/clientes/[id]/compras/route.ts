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

    // 2. Query purchases with optional month filter
    let sql = `
      SELECT id, cliente_id, descricao, data_compra, quantidade, valor, pago, forma_pagamento, criado_em, atualizado_em
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

    // 3. Somatório de dívidas (tudo diferente de pago = false para todo o histórico do cliente)
    const totalDividaRes = await query<{ total: number }>(
      `SELECT COALESCE(SUM(valor), 0)::numeric as total 
       FROM lancamentos_fiado 
       WHERE cliente_id = $1 AND pago = false`,
      [id]
    );

    // Also get debt for the filtered month if filter is active
    let dividaMesFiltrado = totalDividaRes.rows[0]?.total || 0;
    if (mes) {
      const dividaMesRes = await query<{ total: number }>(
        `SELECT COALESCE(SUM(valor), 0)::numeric as total 
         FROM lancamentos_fiado 
         WHERE cliente_id = $1 AND pago = false
           AND data_compra >= $2::date AND data_compra < ($2::date + INTERVAL '1 month')`,
        [id, `${mes}-01`]
      );
      dividaMesFiltrado = dividaMesRes.rows[0]?.total || 0;
    }

    return NextResponse.json({
      cliente,
      compras: purchasesRes.rows,
      somatorioDividaGeral: Number(totalDividaRes.rows[0]?.total || 0),
      somatorioDividaMes: Number(dividaMesFiltrado),
    });
  } catch (error: any) {
    console.error('Error fetching client purchases:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    const { descricao, data_compra, quantidade, valor, pago, forma_pagamento } = body;

    if (!descricao || valor === undefined) {
      return NextResponse.json(
        { error: 'Descrição e valor são obrigatórios.' },
        { status: 400 }
      );
    }

    const res = await query(
      `INSERT INTO lancamentos_fiado (
         cliente_id,
         descricao,
         data_compra,
         quantidade,
         valor,
         pago,
         forma_pagamento
       ) VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE), COALESCE($4, 1), $5, COALESCE($6, false), $7)
       RETURNING *`,
      [
        id,
        descricao.trim(),
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
    const { id: lancamentoId, descricao, data_compra, quantidade, valor, pago, forma_pagamento } = body;

    if (!lancamentoId) {
      return NextResponse.json({ error: 'ID do lançamento é obrigatório.' }, { status: 400 });
    }

    const res = await query(
      `UPDATE lancamentos_fiado
       SET descricao = COALESCE($1, descricao),
           data_compra = COALESCE($2::date, data_compra),
           quantidade = COALESCE($3, quantidade),
           valor = COALESCE($4, valor),
           pago = COALESCE($5, pago),
           forma_pagamento = COALESCE($6, forma_pagamento)
       WHERE id = $7 AND cliente_id = $8
       RETURNING *`,
      [
        descricao?.trim(),
        data_compra || null,
        quantidade !== undefined ? parseInt(quantidade, 10) : null,
        valor !== undefined ? parseFloat(valor) : null,
        pago !== undefined ? pago : null,
        forma_pagamento,
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
