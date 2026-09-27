'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  ChevronRight,
  X,
  AlertTriangle,
  Receipt,
  Check,
  ArrowDownCircle,
  ShoppingCart,
  UserCheck,
  UserX,
  UserMinus,
  EyeOff,
  Eye,
} from 'lucide-react';
import { Cliente, LancamentoFiado } from '@/lib/types';

interface ItemVenda {
  descricao: string;
  quantidade: string;
  valor: string;
}

const emptyItem = (): ItemVenda => ({ descricao: '', quantidade: '1', valor: '' });

export function ClientesView() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInativos, setShowInativos] = useState(false);

  // Selected client for purchase sheet
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [compras, setCompras] = useState<LancamentoFiado[]>([]);
  const [loadingCompras, setLoadingCompras] = useState(false);
  const [mesFiltro, setMesFiltro] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [somatorioDividaGeral, setSomatorioDividaGeral] = useState(0);
  const [somatorioDividaMes, setSomatorioDividaMes] = useState(0);

  // Modal: New Client
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
  const [clientModalLoading, setClientModalLoading] = useState(false);

  // Modal: Nova Compra (multi-item)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<LancamentoFiado | null>(null);
  const [vendaData, setVendaData] = useState(() => new Date().toISOString().split('T')[0]);
  const [vendaNomeComprador, setVendaNomeComprador] = useState('');
  const [vendaItens, setVendaItens] = useState<ItemVenda[]>([emptyItem()]);
  const [purchaseModalLoading, setPurchaseModalLoading] = useState(false);

  // Modal: Pagamento
  const [isPagamentoModalOpen, setIsPagamentoModalOpen] = useState(false);
  const [pagamentoValor, setPagamentoValor] = useState('');
  const [pagamentoData, setPagamentoData] = useState(() => new Date().toISOString().split('T')[0]);
  const [pagamentoForma, setPagamentoForma] = useState('Dinheiro');
  const [pagamentoDescricao, setPagamentoDescricao] = useState('');
  const [pagamentoLoading, setPagamentoLoading] = useState(false);
  const [pagamentoErro, setPagamentoErro] = useState('');

  // ─── Loaders ──────────────────────────────────────────────────────────────
  const loadClientes = useCallback(async () => {
    setLoading(true);
    try {
      const url = showInativos ? '/api/clientes?inativos=true' : '/api/clientes';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setClientes(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [showInativos]);

  useEffect(() => { loadClientes(); }, [loadClientes]);

  const loadClientPurchases = async (clientId: string, mes?: string) => {
    setLoadingCompras(true);
    try {
      const url = mes
        ? `/api/clientes/${clientId}/compras?mes=${mes}`
        : `/api/clientes/${clientId}/compras`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCompras(data.compras || []);
        setSomatorioDividaGeral(data.somatorioDividaGeral || 0);
        setSomatorioDividaMes(data.somatorioDividaMes || 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoadingCompras(false); }
  };

  useEffect(() => {
    if (selectedClient) loadClientPurchases(selectedClient.id, mesFiltro);
  }, [selectedClient, mesFiltro]);

  // ─── Toggle ativo ─────────────────────────────────────────────────────────
  const handleToggleAtivo = async (cliente: Cliente, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const acao = cliente.ativo ? 'inativar' : 'reativar';
    if (!confirm(`Deseja ${acao} o cliente "${cliente.nome}"?`)) return;

    try {
      await fetch('/api/clientes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cliente.id, ativo: !cliente.ativo }),
      });
      // Se estava na ficha do cliente, volta para a lista
      if (selectedClient?.id === cliente.id) setSelectedClient(null);
      loadClientes();
    } catch (e) { console.error(e); }
  };

  // ─── Handlers: Clientes ───────────────────────────────────────────────────
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoClienteNome.trim()) return;
    setClientModalLoading(true);
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoClienteNome.trim(),
          telefone: novoClienteTelefone.trim() || null,
        }),
      });
      if (res.ok) {
        await loadClientes();
        setNovoClienteNome('');
        setNovoClienteTelefone('');
        setIsClientModalOpen(false);
      }
    } catch (e) { console.error(e); }
    finally { setClientModalLoading(false); }
  };

  // ─── Handlers: Compra multi-item ──────────────────────────────────────────
  const handleOpenAddPurchase = () => {
    setEditingPurchase(null);
    setVendaData(new Date().toISOString().split('T')[0]);
    setVendaNomeComprador('');
    setVendaItens([emptyItem()]);
    setIsPurchaseModalOpen(true);
  };

  const handleOpenEditPurchase = (item: LancamentoFiado) => {
    setEditingPurchase(item);
    setVendaData(item.data_compra);
    setVendaNomeComprador(item.nome_comprador || '');
    setVendaItens([
      { descricao: item.descricao, quantidade: String(item.quantidade), valor: String(item.valor) },
    ]);
    setIsPurchaseModalOpen(true);
  };

  const addVendaItem = () => setVendaItens(prev => [...prev, emptyItem()]);
  const removeVendaItem = (i: number) => setVendaItens(prev => prev.filter((_, idx) => idx !== i));
  const updateVendaItem = (i: number, field: keyof ItemVenda, val: string) =>
    setVendaItens(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const vendaTotal = vendaItens.reduce((sum, it) =>
    sum + (parseFloat(it.valor) || 0) * (parseInt(it.quantidade, 10) || 1), 0);

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    const validItens = vendaItens.filter(it => it.descricao.trim() && it.valor);
    if (validItens.length === 0) return;

    setPurchaseModalLoading(true);
    try {
      if (editingPurchase) {
        const it = validItens[0];
        const res = await fetch(`/api/clientes/${selectedClient.id}/compras`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingPurchase.id,
            descricao: it.descricao.trim(),
            nome_comprador: vendaNomeComprador.trim() || null,
            data_compra: vendaData,
            quantidade: parseInt(it.quantidade, 10) || 1,
            valor: parseFloat(it.valor),
            pago: false,
          }),
        });
        if (res.ok) { setIsPurchaseModalOpen(false); loadClientPurchases(selectedClient.id, mesFiltro); loadClientes(); }
      } else {
        const res = await fetch(`/api/clientes/${selectedClient.id}/compras`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itens: validItens,
            data_compra: vendaData,
            nome_comprador: vendaNomeComprador.trim() || null,
            pago: false,
          }),
        });
        if (res.ok) { setIsPurchaseModalOpen(false); loadClientPurchases(selectedClient.id, mesFiltro); loadClientes(); }
      }
    } catch (e) { console.error(e); }
    finally { setPurchaseModalLoading(false); }
  };

  // ─── Handlers: Pagamento ──────────────────────────────────────────────────
  const handleOpenPagamento = () => {
    setPagamentoValor('');
    setPagamentoData(new Date().toISOString().split('T')[0]);
    setPagamentoForma('Dinheiro');
    setPagamentoDescricao('');
    setPagamentoErro('');
    setIsPagamentoModalOpen(true);
  };

  const handleSavePagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setPagamentoErro('');
    const valor = parseFloat(pagamentoValor);
    if (!valor || valor <= 0) { setPagamentoErro('Informe um valor válido maior que zero.'); return; }
    if (valor > somatorioDividaGeral + 0.001) {
      setPagamentoErro(`R$ ${valor.toFixed(2).replace('.', ',')} excede a dívida de R$ ${somatorioDividaGeral.toFixed(2).replace('.', ',')}.`);
      return;
    }

    setPagamentoLoading(true);
    try {
      const res = await fetch(`/api/clientes/${selectedClient.id}/compras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'pagamento',
          valor,
          data_compra: pagamentoData,
          forma_pagamento: pagamentoForma,
          descricao: pagamentoDescricao.trim() || 'Pagamento recebido',
        }),
      });
      if (res.ok) { setIsPagamentoModalOpen(false); loadClientPurchases(selectedClient.id, mesFiltro); loadClientes(); }
    } catch (e) { console.error(e); }
    finally { setPagamentoLoading(false); }
  };

  // ─── Handlers: Toggle pago / Delete ──────────────────────────────────────
  const handleDeletePurchase = async (purchaseId: string) => {
    if (!selectedClient || !confirm('Deseja realmente excluir este lançamento?')) return;
    try {
      await fetch(`/api/clientes/${selectedClient.id}/compras?purchase_id=${purchaseId}`, { method: 'DELETE' });
      loadClientPurchases(selectedClient.id, mesFiltro);
      loadClientes();
    } catch (e) { console.error(e); }
  };

  // ─── Filter ───────────────────────────────────────────────────────────────
  const filteredClientes = clientes.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.telefone && c.telefone.includes(searchTerm))
  );

  const FORMAS_PAGAMENTO = ['Dinheiro', 'Pix', 'Cartão de crédito', 'Cartão de débito'];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 relative pb-20">
      {!selectedClient ? (
        /* ════════════════════════════════════════════
           LISTA DE CLIENTES
           ════════════════════════════════════════════ */
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--card-border)] gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-500" />
                Clientes e Contas Fiadas
                {showInativos && (
                  <span className="text-[11px] font-normal bg-foreground/10 text-foreground/60 px-2 py-0.5 rounded-full">
                    Inativos
                  </span>
                )}
              </h3>
              <p className="text-xs text-foreground/60">
                Gerencie contas a receber, lançamentos por cliente e quitações.
              </p>
            </div>

            {/* Barra de busca + botão inativos */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome ou telefone..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Botão Inativos */}
              <button
                onClick={() => { setShowInativos(v => !v); setSearchTerm(''); }}
                title={showInativos ? 'Ver ativos' : 'Ver inativos'}
                className={`flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap ${
                  showInativos
                    ? 'bg-foreground/10 border-foreground/20 text-foreground'
                    : 'bg-card border-[var(--card-border)] text-foreground/60 hover:text-foreground hover:border-foreground/30'
                }`}
              >
                {showInativos ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {showInativos ? 'Ativos' : 'Inativos'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-foreground/50">Carregando clientes...</div>
          ) : filteredClientes.length === 0 ? (
            <div className="py-12 text-center text-xs text-foreground/50 flex flex-col items-center gap-2">
              <Users className="w-10 h-10 stroke-1 text-foreground/30" />
              {showInativos ? 'Nenhum cliente inativo.' : 'Nenhum cliente ativo. Clique em "+" para adicionar.'}
            </div>
          ) : (
            <div className="divide-y divide-[var(--card-border)]/50">
              {filteredClientes.map((c) => {
                const divida = Math.max(0, Number(c.total_divida || 0));
                const temDivida = divida > 0;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedClient(c)}
                    className="py-3.5 flex items-center justify-between hover:bg-white/5 px-2 rounded-2xl cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform ${
                        c.ativo ? 'bg-brand-500/10 text-brand-500' : 'bg-foreground/10 text-foreground/40'
                      }`}>
                        {c.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold transition-colors ${
                          c.ativo ? 'text-foreground group-hover:text-brand-500' : 'text-foreground/40 line-through'
                        }`}>
                          {c.nome}
                        </h4>
                        <p className="text-xs text-foreground/50 flex items-center gap-2">
                          {c.telefone ? (
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.telefone}</span>
                          ) : (
                            <span>Sem telefone</span>
                          )}
                          <span>• {c.total_compras || 0} lançamento(s)</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="text-[10px] text-foreground/50 block">Dívida Pendente</span>
                        <span className={`font-mono font-extrabold text-sm ${
                          temDivida ? 'text-rose-500' : 'text-emerald-500'
                        }`}>
                          R$ {divida.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {/* Botão inativar/reativar */}
                      <button
                        onClick={(e) => handleToggleAtivo(c, e)}
                        title={c.ativo ? 'Inativar cliente' : 'Reativar cliente'}
                        className={`p-2 rounded-xl border transition-all ${
                          c.ativo
                            ? 'text-foreground/40 border-transparent hover:text-rose-400 hover:border-rose-400/30 hover:bg-rose-500/10'
                            : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20'
                        }`}
                      >
                        {c.ativo ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>

                      <ChevronRight className="w-4 h-4 text-foreground/40 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ════════════════════════════════════════════
           FICHA DO CLIENTE
           ════════════════════════════════════════════ */
        <div className="glass-panel p-6 rounded-3xl space-y-5 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--card-border)] gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 rounded-xl text-foreground/60 hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-brand-500" />
                  Conta de {selectedClient.nome}
                  {!selectedClient.ativo && (
                    <span className="text-[11px] font-normal bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full">
                      Inativo
                    </span>
                  )}
                </h3>
                <p className="text-xs text-foreground/60">
                  {selectedClient.telefone || 'Sem telefone'} • Cadastrado em{' '}
                  {new Date(selectedClient.criado_em).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro Mês */}
              <div className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-xl border border-[var(--card-border)] text-xs">
                <Calendar className="w-3.5 h-3.5 text-brand-500" />
                <span className="text-foreground/60">Mês:</span>
                <input
                  type="month"
                  value={mesFiltro}
                  onChange={(e) => setMesFiltro(e.target.value)}
                  className="bg-transparent text-foreground text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* Botão Inativar/Reativar na ficha */}
              <button
                onClick={() => handleToggleAtivo(selectedClient)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all border ${
                  selectedClient.ativo
                    ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                    : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                {selectedClient.ativo
                  ? <><UserMinus className="w-3.5 h-3.5" /> Inativar</>
                  : <><UserCheck className="w-3.5 h-3.5" /> Reativar</>
                }
              </button>

              {selectedClient.ativo && (
                <>
                  <button
                    onClick={handleOpenPagamento}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-all"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    Registrar Pagamento
                  </button>
                  <button
                    onClick={handleOpenAddPurchase}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-500 text-white font-semibold text-xs hover:bg-brand-600 transition-all"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Nova Compra
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Cards saldo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl px-5 py-4">
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block mb-1">
                Dívida Total Acumulada
              </span>
              <span className="text-2xl font-extrabold text-rose-400 font-mono">
                R$ {somatorioDividaGeral.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="bg-brand-500/10 border border-brand-500/20 rounded-2xl px-5 py-4">
              <span className="text-[11px] font-semibold text-brand-400 uppercase tracking-wider block mb-1">
                Pendente no Mês ({mesFiltro})
              </span>
              <span className="text-2xl font-extrabold text-brand-400 font-mono">
                R$ {somatorioDividaMes.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Tabela */}
          {loadingCompras ? (
            <div className="py-12 text-center text-xs text-foreground/50">Carregando lançamentos...</div>
          ) : compras.length === 0 ? (
            <div className="py-12 text-center text-xs text-foreground/50">
              Nenhum lançamento no mês selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--card-border)] text-foreground/60 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Descrição</th>
                    <th className="py-2.5 px-3">Comprador</th>
                    <th className="py-2.5 px-3 text-center">Qtd</th>
                    <th className="py-2.5 px-3">Valor</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]/50">
                  {compras.map((c) => {
                    const isPagamento = c.tipo === 'pagamento';
                    return (
                      <tr key={c.id} className={`hover:bg-white/5 transition-colors ${isPagamento ? 'bg-emerald-500/5' : ''}`}>
                        <td className="py-3 px-3 font-mono text-foreground/75 whitespace-nowrap">
                          {new Date(c.data_compra + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-3 font-semibold text-foreground">
                          {isPagamento ? (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <ArrowDownCircle className="w-3.5 h-3.5 shrink-0" />
                              {c.descricao}
                            </span>
                          ) : c.descricao}
                        </td>
                        <td className="py-3 px-3 text-foreground/60 text-[11px]">
                          {c.nome_comprador ? (
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-brand-400" />
                              {c.nome_comprador}
                            </span>
                          ) : <span className="text-foreground/25">—</span>}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {isPagamento ? '—' : c.quantidade}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold">
                          <span className={isPagamento ? 'text-emerald-400' : 'text-foreground'}>
                            {isPagamento ? '− ' : ''}R$ {Number(c.valor).toFixed(2).replace('.', ',')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                          {!isPagamento && selectedClient.ativo && (
                            <button
                              onClick={() => handleOpenEditPurchase(c)}
                              className="p-1.5 rounded-lg text-foreground/60 hover:text-brand-500 hover:bg-brand-500/10 transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePurchase(c.id)}
                            className="p-1.5 rounded-lg text-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── FAB: Novo Cliente (só ativos) ─────────────────────────────────── */}
      {!selectedClient && !showInativos && (
        <button
          onClick={() => setIsClientModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 rounded-full bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/30 hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Novo Cliente</span>
        </button>
      )}

      {/* ════════════════════════════════════════════
          MODAL: Novo Cliente
          ════════════════════════════════════════════ */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-[var(--card-border)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-500" />
                <h3 className="text-base font-bold text-foreground">Novo Cliente</h3>
              </div>
              <button onClick={() => setIsClientModalOpen(false)} className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nome do Cliente <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text" required value={novoClienteNome}
                  onChange={(e) => setNovoClienteNome(e.target.value)}
                  placeholder="Ex: Seu Raimundo da Padaria"
                  className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Telefone / WhatsApp</label>
                <input
                  type="text" value={novoClienteTelefone}
                  onChange={(e) => setNovoClienteTelefone(e.target.value)}
                  placeholder="Ex: (11) 98765-4321"
                  className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button type="button" onClick={() => setIsClientModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-foreground/70 hover:bg-white/5">Cancelar</button>
                <button type="submit" disabled={clientModalLoading} className="px-5 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 disabled:opacity-50 transition-all">
                  {clientModalLoading ? 'Salvando...' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          MODAL: Registrar Pagamento
          ════════════════════════════════════════════ */}
      {isPagamentoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 border border-[var(--card-border)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-foreground">Registrar Pagamento</h3>
              </div>
              <button onClick={() => setIsPagamentoModalOpen(false)} className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-foreground/70">Dívida de <strong>{selectedClient?.nome}</strong>:</span>
              <span className="font-mono font-extrabold text-rose-400 text-base">
                R$ {somatorioDividaGeral.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <form onSubmit={handleSavePagamento} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Valor Recebido (R$) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number" step="0.01" min="0.01" required autoFocus
                  value={pagamentoValor}
                  onChange={(e) => { setPagamentoValor(e.target.value); setPagamentoErro(''); }}
                  placeholder="0,00"
                  className="w-full h-11 px-3 rounded-xl bg-card border border-[var(--card-border)] text-base font-mono font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {pagamentoErro && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {pagamentoErro}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Data</label>
                  <input type="date" value={pagamentoData} onChange={(e) => setPagamentoData(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Forma</label>
                  <select value={pagamentoForma} onChange={(e) => setPagamentoForma(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Observação <span className="text-foreground/40 font-normal">(opcional)</span>
                </label>
                <input type="text" value={pagamentoDescricao} onChange={(e) => setPagamentoDescricao(e.target.value)}
                  placeholder="Ex: Pagamento parcial em dinheiro"
                  className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button type="button" onClick={() => setIsPagamentoModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-foreground/70 hover:bg-white/5">Cancelar</button>
                <button type="submit" disabled={pagamentoLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  {pagamentoLoading ? 'Salvando...' : 'Confirmar Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          MODAL: Nova Compra (multi-item)
          ════════════════════════════════════════════ */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-[var(--card-border)] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-brand-500" />
                <h3 className="text-base font-bold text-foreground">
                  {editingPurchase ? 'Editar Lançamento' : 'Nova Compra no Fiado'}
                </h3>
              </div>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-4">
              {/* Data + Nome do comprador */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Data da Compra</label>
                  <input type="date" value={vendaData} onChange={(e) => setVendaData(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-brand-400" />
                    Quem veio buscar?
                  </label>
                  <input type="text" value={vendaNomeComprador} onChange={(e) => setVendaNomeComprador(e.target.value)}
                    placeholder={`Opcional — ex: filho`}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Lista de itens */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-foreground">
                    Itens <span className="text-rose-500">*</span>
                  </label>
                  {!editingPurchase && (
                    <button type="button" onClick={addVendaItem}
                      className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Adicionar item
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {vendaItens.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-card/50 rounded-xl p-2.5 border border-[var(--card-border)]">
                      <div className="flex-1 min-w-0">
                        <input type="text" required value={item.descricao}
                          onChange={(e) => updateVendaItem(idx, 'descricao', e.target.value)}
                          placeholder="Descrição / Produto"
                          className="w-full h-9 px-3 rounded-lg bg-background border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 mb-1.5"
                        />
                        <div className="flex gap-2 items-start">
                          <div className="w-20">
                            <input type="number" min="1" value={item.quantidade}
                              onChange={(e) => updateVendaItem(idx, 'quantidade', e.target.value)}
                              className="w-full h-8 px-2 rounded-lg bg-background border border-[var(--card-border)] text-xs text-center font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                            <span className="text-[10px] text-foreground/40 text-center block mt-0.5">Qtd</span>
                          </div>
                          <div className="flex-1">
                            <input type="number" step="0.01" min="0.01" required value={item.valor}
                              onChange={(e) => updateVendaItem(idx, 'valor', e.target.value)}
                              placeholder="Valor unit."
                              className="w-full h-8 px-2 rounded-lg bg-background border border-[var(--card-border)] text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                            <span className="text-[10px] text-foreground/40 block mt-0.5">Valor unit. (R$)</span>
                          </div>
                          {item.valor && (
                            <div className="text-[11px] font-mono font-bold text-brand-400 self-start pt-1.5 whitespace-nowrap">
                              = R$ {((parseFloat(item.valor) || 0) * (parseInt(item.quantidade, 10) || 1)).toFixed(2).replace('.', ',')}
                            </div>
                          )}
                        </div>
                      </div>
                      {!editingPurchase && vendaItens.length > 1 && (
                        <button type="button" onClick={() => removeVendaItem(idx)}
                          className="p-1.5 rounded-lg text-foreground/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors mt-0.5 shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-foreground/50">Total da compra a lançar no fiado</span>
                <span className="font-mono font-extrabold text-lg text-foreground">
                  R$ {vendaTotal.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button type="button" onClick={() => setIsPurchaseModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-foreground/70 hover:bg-white/5">Cancelar</button>
                <button type="submit" disabled={purchaseModalLoading}
                  className="px-5 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 disabled:opacity-50 transition-all flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  {purchaseModalLoading ? 'Salvando...'
                    : editingPurchase ? 'Salvar Alterações'
                    : `Lançar ${vendaItens.filter(i => i.descricao && i.valor).length} item(s) no fiado`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
