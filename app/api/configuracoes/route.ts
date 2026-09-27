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

    // 1. Fetch configuracoes key-values
    const configRes = await query(`SELECT chave, valor FROM configuracoes`);
    const configMap: Record<string, any> = {};
    for (const row of configRes.rows) {
      // valor is stored as jsonb
      configMap[row.chave] = row.valor;
    }

    // 2. Fetch funcionarios
    const funcRes = await query(
      `SELECT id, nome, ativo, criado_em, atualizado_em FROM funcionarios ORDER BY nome ASC`
    );

    // 3. Fetch categorias with product count
    const catRes = await query(
      `SELECT c.id, c.nome, c.ativa, c.criado_em,
              COUNT(p.id)::int as total_produtos
       FROM categorias c
       LEFT JOIN produtos p ON p.categoria_id = c.id
       GROUP BY c.id, c.nome, c.ativa, c.criado_em
       ORDER BY c.nome ASC`
    );

    return NextResponse.json({
      tema: configMap['tema'] || 'escuro',
      cor_primaria: configMap['cor_primaria'] || 'azul',
      modulo_clientes: configMap['modulo_clientes'] !== undefined ? configMap['modulo_clientes'] : true,
      funcionarios: funcRes.rows,
      categorias: catRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching configuracoes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Only admin can change system configuration
    if (user.papel !== 'administrador') {
      return NextResponse.json(
        { error: 'Apenas administradores podem alterar as configurações do sistema.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // Action 1: Update general settings (theme, primary color, modulo_clientes)
    if (action === 'update_settings') {
      const { tema, cor_primaria, modulo_clientes } = body;

      if (tema !== undefined) {
        await query(
          `INSERT INTO configuracoes (chave, valor)
           VALUES ('tema', $1::jsonb)
           ON CONFLICT (chave) DO UPDATE SET valor = $1::jsonb, atualizado_em = NOW()`,
          [JSON.stringify(tema)]
        );
      }

      if (cor_primaria !== undefined) {
        await query(
          `INSERT INTO configuracoes (chave, valor)
           VALUES ('cor_primaria', $1::jsonb)
           ON CONFLICT (chave) DO UPDATE SET valor = $1::jsonb, atualizado_em = NOW()`,
          [JSON.stringify(cor_primaria)]
        );
      }

      if (modulo_clientes !== undefined) {
        await query(
          `INSERT INTO configuracoes (chave, valor)
           VALUES ('modulo_clientes', $1::jsonb)
           ON CONFLICT (chave) DO UPDATE SET valor = $1::jsonb, atualizado_em = NOW()`,
          [JSON.stringify(modulo_clientes)]
        );
      }

      return NextResponse.json({ success: true });
    }

    // Action 2: Add funcionario
    if (action === 'add_funcionario') {
      const { nome } = body;
      if (!nome || !nome.trim()) {
        return NextResponse.json({ error: 'Nome do funcionário é obrigatório.' }, { status: 400 });
      }

      const res = await query(
        `INSERT INTO funcionarios (nome, ativo) VALUES ($1, true) RETURNING *`,
        [nome.trim()]
      );
      return NextResponse.json(res.rows[0], { status: 201 });
    }

    // Action 3: Toggle / delete funcionario
    if (action === 'toggle_funcionario') {
      const { id, ativo } = body;
      const res = await query(
        `UPDATE funcionarios SET ativo = $1 WHERE id = $2 RETURNING *`,
        [ativo, id]
      );
      return NextResponse.json(res.rows[0]);
    }

    if (action === 'delete_funcionario') {
      const { id } = body;
      await query(`DELETE FROM funcionarios WHERE id = $1`, [id]);
      return NextResponse.json({ success: true });
    }

    // Action 4: Manage Categories
    if (action === 'add_categoria') {
      const { nome } = body;
      if (!nome || !nome.trim()) {
        return NextResponse.json({ error: 'Nome da categoria é obrigatório.' }, { status: 400 });
      }

      const res = await query(
        `INSERT INTO categorias (nome, ativa) VALUES ($1, true) RETURNING *`,
        [nome.trim()]
      );
      return NextResponse.json(res.rows[0], { status: 201 });
    }

    if (action === 'update_categoria') {
      const { id, nome, ativa } = body;
      const res = await query(
        `UPDATE categorias 
         SET nome = COALESCE($1, nome),
             ativa = COALESCE($2, ativa)
         WHERE id = $3
         RETURNING *`,
        [nome ? nome.trim() : null, ativa, id]
      );
      return NextResponse.json(res.rows[0]);
    }

    if (action === 'delete_categoria') {
      const { id } = body;
      // Regra: Não excluir categorias que já possuem produtos vinculados
      const checkRes = await query(
        `SELECT COUNT(*)::int as count FROM produtos WHERE categoria_id = $1`,
        [id]
      );
      const prodCount = checkRes.rows[0]?.count || 0;
      if (prodCount > 0) {
        return NextResponse.json(
          { error: `Esta categoria possui ${prodCount} produto(s) vinculado(s) e não pode ser excluída.` },
          { status: 400 }
        );
      }

      await query(`DELETE FROM categorias WHERE id = $1`, [id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação não reconhecida.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating configuracoes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
