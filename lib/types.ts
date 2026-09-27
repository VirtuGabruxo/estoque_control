export type UserRole = 'administrador' | 'convidado';

export interface User {
  id: string;
  auth_id: string;
  nome: string;
  sobrenome: string;
  email: string;
  telefone?: string;
  papel: UserRole;
  criado_em: string;
  atualizado_em: string;
}

export interface Funcionario {
  id: string;
  nome: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Categoria {
  id: string;
  nome: string;
  ativa: boolean;
  criado_em: string;
  total_produtos?: number;
}

export interface LoteEstoque {
  id: string;
  produto_id: string;
  data_validade: string;
  quantidade: number;
  criado_em: string;
  atualizado_em: string;
}

export interface Produto {
  id: string;
  nome: string;
  codigo_barras: string;
  categoria_id: string;
  categoria_nome?: string;
  criado_em: string;
  atualizado_em: string;
  estoque_total?: number;
  proxima_validade?: string;
  lotes?: LoteEstoque[];
}

export interface MovimentacaoItem {
  id: string;
  movimentacao_id: string;
  produto_id: string;
  produto_nome?: string;
  codigo_barras?: string;
  lote_id?: string;
  quantidade: number;
  estoque_anterior?: number;
  estoque_atual?: number;
}

export interface Movimentacao {
  id: string;
  tipo: 'entrada' | 'saida';
  responsavel: string;
  funcionario_id?: string;
  usuario_id?: string;
  criado_em: string;
  itens?: MovimentacaoItem[];
}

export interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  total_divida?: number;
  total_compras?: number;
}

export interface LancamentoFiado {
  id: string;
  cliente_id: string;
  tipo: 'compra' | 'pagamento';
  descricao: string;
  nome_comprador?: string;
  data_compra: string;
  quantidade: number;
  valor: number;
  pago: boolean;
  forma_pagamento?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  dados?: {
    produto_id?: string;
    lote_id?: string;
    data_validade?: string;
  };
  criado_em: string;
}

export interface Configuracao {
  id: string;
  chave: string;
  valor: any;
  atualizado_em: string;
}
