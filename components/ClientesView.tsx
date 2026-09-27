'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  ChevronRight,
  X,
  CreditCard,
  AlertTriangle,
  Receipt,
  Check,
  Minus,
  ArrowDownCircle,
  ShoppingCart,
  UserCheck,
} from 'lucide-react';
import { Cliente, LancamentoFiado } from '@/lib/types';

const FORMAS_PAGAMENTO = ['Dinheiro', 'Pix', 'Cartão de crédito', 'Cartão de débito'];

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

  // Modal: Add New Client
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
  const [clientModalLoading, setClientModalLoading] = useState(false);

  // Modal: Add / Edit Purchase (multi-item)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<LancamentoFiado | null>(null);
  const [vendaData, setVendaData] = useState(() => new Date().toISOString().split('T')[0]);
  const [vendaNomeComprador, setVendaNomeComprador] = useState('');
  const [vendaPago, setVendaPago] = useState(false);
  const [vendaForma, setVendaForma] = useState('Dinheiro');
  const [vendaItens, setVendaItens] = useState<ItemVenda[]>([emptyItem()]);
  const [purchaseModalLoading, setPurchaseModalLoading] = useState(false);

  // Modal: Registrar Pagamento
  const [isPagamentoModalOpen, setIsPagamentoModalOpen] = useState(false);
  const [pagamentoValor, setPagamentoValor] = useState('');
  const [pagamentoData, setPagamentoData] = useState(() => new Date().toISOString().split('T')[0]);
  const [pagamentoForma, setPagamentoForma] = useState('Dinheiro');
  const [pagamentoDescricao, setPagamentoDescricao] = useState('');
  const [pagamentoLoading, setPagamentoLoading] = useState(false);
  const [pagamentoErro, setPagamentoErro] = useState('');

  // ─── Loaders ──────────────────────────────────────────────────────────────
  const loadClientes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clientes');
      if (res.ok) {
        const data = await res.json();
        setClientes(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCompras(false);
    }
  };

  useEffect(() => {
    if (selectedClient) {
      loadClientPurchases(selectedClient.id, mesFiltro);
    }
  }, [selectedClient, mesFiltro]);

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
        const newClient = await res.json();
        setClientes((prev) => [newClient, ...prev]);
        setNovoClienteNome('');
        setNovoClienteTelefone('');
        setIsClientModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClientModalLoading(false);
    }
  };

  // ─── Handlers: Multi-item Purchase Modal ──────────────────────────────────
  const handleOpenAddPurchase = () => {
    setEditingPurchase(null);
    setVendaData(new Date().toISOString().split('T')[0]);
    setVendaNomeComprador('');
    setVendaPago(false);
    setVendaForma('Dinheiro');
    setVendaItens([emptyItem()]);
    setIsPurchaseModalOpen(true);
  };

  const handleOpenEditPurchase = (item: LancamentoFiado) => {
    setEditingPurchase(item);
    setVendaData(item.data_compra);
    setVendaNomeComprador(item.nome_comprador || '');
    setVendaPago(item.pago);
    setVendaForma(item.forma_pagamento || 'Dinheiro');
    setVendaItens([
      { descricao: item.descricao, quantidade: String(item.quantidade), valor: String(item.valor) },
    ]);
    setIsPurchaseModalOpen(true);
  };

  const addVendaItem = () => setVendaItens((prev) => [...prev, emptyItem()]);

  const removeVendaItem = (index: number) =>
    setVendaItens((prev) => prev.filter((_, i) => i !== index));

  const updateVendaItem = (index: number, field: keyof ItemVenda, value: string) =>
    setVendaItens((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );

  const vendaTotal = vendaItens.reduce((sum, it) => {
    const v = parseFloat(it.valor) || 0;
    const q = parseInt(it.quantidade, 10) || 1;
    return sum + v * q;
  }, 0);

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const validItens = vendaItens.filter((it) => it.descricao.trim() && it.valor);
    if (validItens.length === 0) return;

    setPurchaseModalLoading(true);
    try {
      if (editingPurchase) {
        // Editing = single item PUT
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
            pago: vendaPago,
            forma_pagamento: vendaForma,
          }),
        });
        if (res.ok) {
          setIsPurchaseModalOpen(false);
          loadClientPurchases(selectedClient.id, mesFiltro);
          loadClientes();
        }
      } else {
        // New: batch POST
        const res = await fetch(`/api/clientes/${selectedClient.id}/compras`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itens: validItens,
            data_compra: vendaData,
            nome_comprador: vendaNomeComprador.trim() || null,
            pago: vendaPago,
            forma_pagamento: vendaForma,
          }),
        });
        if (res.ok) {
          setIsPurchaseModalOpen(false);
          loadClientPurchases(selectedClient.id, mesFiltro);
          loadClientes();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPurchaseModalLoading(false);
    }
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
    if (!valor || valor <= 0) {
      setPagamentoErro('Informe um valor válido maior que zero.');
      return;
    }

    if (valor > somatorioDividaGeral) {
      setPagamentoErro(
        `Valor R$ ${valor.toFixed(2).replace('.', ',')} excede a dívida atual de R$ ${somatorioDividaGeral.toFixed(2).replace('.', ',')}.`
      );
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
      if (res.ok) {
        setIsPagamentoModalOpen(false);
        loadClientPurchases(selectedClient.id, mesFiltro);
        loadClientes();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPagamentoLoading(false);
    }
  };

  // ─── Handlers: Toggle pago / Delete ───────────────────────────────────────
  const handleTogglePaid = async (item: LancamentoFiado) => {
    if (!selectedClient || item.tipo === 'pagamento') return;
    try {
      await fetch(`/api/clientes/${selectedClient.id}/compras`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, pago: !item.pago }),
      });
      loadClientPurchases(selectedClient.id, mesFiltro);
      loadClientes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (!selectedClient || !confirm('Deseja realmente excluir este lançamento?')) return;
    try {
      await fetch(
        `/api/clientes/${selectedClient.id}/compras?purchase_id=${purchaseId}`,
        { method: 'DELETE' }
      );
      loadClientPurchases(selectedClient.id, mesFiltro);
      loadClientes();
    } catch (e) {
      console.error(e);
    }
  };

  // ─── Filter ───────────────────────────────────────────────────────────────
  const filteredClientes = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.telefone && c.telefone.includes(searchTerm))
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 relative pb-20">
      {!selectedClient ? (
        /* ════════════════════════════════════════════
           LISTA PRINCIPAL DE CLIENTES
           ════════════════════════════════════════════ */
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--card-border)] gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-500" />
                Clientes e Contas Fiadas
              </h3>
              <p className="text-xs text-foreground/60">
                Gerencie contas a receber, lançamentos por cliente e quitações.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente por nome ou telefone..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-foreground/50">Carregando clientes...</div>
          ) : filteredClientes.length === 0 ? (
            <div className="py-12 text-center text-xs text-foreground/50 flex flex-col items-center gap-2">
              <Users className="w-10 h-10 stroke-1 text-foreground/30" />
              Nenhum cliente cadastrado no fiado. Clique no botão "+" abaixo para adicionar.
            </div>
          ) : (
            <div className="divide-y divide-[var(--card-border)]/50">
              {filteredClientes.map((c) => {
                const divida = Number(c.total_divida || 0);
                const temDivida = divida > 0;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedClient(c)}
                    className="py-3.5 flex items-center justify-between hover:bg-white/5 px-2 rounded-2xl cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform">
                        {c.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-brand-500 transition-colors">
                          {c.nome}
                        </h4>
                        <p className="text-xs text-foreground/50 flex items-center gap-2">
                          {c.telefone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {c.telefone}
                            </span>
                          ) : (
                            <span>Sem telefone</span>
                          )}
                          <span>• {c.total_compras || 0} lançamento(s)</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[10px] text-foreground/50 block">Dívida Pendente</span>
                        <span
                          className={`font-mono font-extrabold text-sm ${
                            temDivida ? 'text-rose-500' : 'text-emerald-500'
                          }`}
                        >
                          R$ {divida.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
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
                title="Voltar à lista"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-brand-500" />
                  Conta de {selectedClient.nome}
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

              {/* Botão Pagamento */}
              <button
                onClick={handleOpenPagamento}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-all shadow-sm"
              >
                <ArrowDownCircle className="w-3.5 h-3.5" />
                <span>Registrar Pagamento</span>
              </button>

              {/* Botão Nova Compra */}
              <button
                onClick={handleOpenAddPurchase}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-500 text-white font-semibold text-xs hover:bg-brand-600 transition-all shadow-sm"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Nova Compra</span>
              </button>
            </div>
          </div>

          {/* Saldo em destaque */}
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

          {/* Tabela de Lançamentos */}
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
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]/50">
                  {compras.map((c) => {
                    const isPagamento = c.tipo === 'pagamento';
                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-white/5 transition-colors ${
                          isPagamento ? 'bg-emerald-500/5' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-mono text-foreground/75 whitespace-nowrap">
                          {new Date(c.data_compra + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-3 font-semibold text-foreground">
                          {isPagamento ? (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <ArrowDownCircle className="w-3.5 h-3.5 shrink-0" />
                              {c.descricao}
                            </span>
                          ) : (
                            c.descricao
                          )}
                        </td>
                        <td className="py-3 px-3 text-foreground/60 text-[11px]">
                          {c.nome_comprador ? (
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-brand-400" />
                              {c.nome_comprador}
                            </span>
                          ) : (
                            <span className="text-foreground/30">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {isPagamento ? '—' : c.quantidade}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold">
                          <span className={isPagamento ? 'text-emerald-400' : 'text-foreground'}>
                            {isPagamento ? '- ' : ''}R$ {Number(c.valor).toFixed(2).replace('.', ',')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isPagamento ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Pago
                            </span>
                          ) : (
                            <button
                              onClick={() => handleTogglePaid(c)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                c.pago
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {c.pago ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" /> Pago
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" /> Pendente
                                </>
                              )}
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                          {!isPagamento && (
                            <button
                              onClick={() => handleOpenEditPurchase(c)}
                              className="p-1.5 rounded-lg text-foreground/60 hover:text-brand-500 hover:bg-brand-500/10 transition-colors"
                              title="Editar lançamento"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePurchase(c.id)}
                            className="p-1.5 rounded-lg text-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Excluir lançamento"
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

      {/* ── FAB: Novo Cliente ──────────────────────────────────────────────── */}
      {!selectedClient && (
        <button
          onClick={() => setIsClientModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 rounded-full bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/30 hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Novo Cliente</span>
        </button>
      )}

      {/* ════════════════════════════════════════════
          MODAL: Cadastrar Novo Cliente
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
                  type="text"
                  required
                  value={novoClienteNome}
                  onChange={(e) => setNovoClienteNome(e.target.value)}
                  placeholder="Ex: Seu Raimundo da Padaria"
                  className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={novoClienteTelefone}
                  onChange={(e) => setNovoClienteTelefone(e.target.value)}
                  placeholder="Ex: (11) 98765-4321"
                  className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button type="button" onClick={() => setIsClientModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-foreground/70 hover:bg-white/5">
                  Cancelar
                </button>
                <button type="submit" disabled={clientModalLoading} className="px-5 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 disabled:opacity-50 transition-all shadow-md">
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

            {/* Dívida atual em destaque */}
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-foreground/70">Dívida atual de <strong>{selectedClient?.nome}</strong>:</span>
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
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  autoFocus
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
                  <input
                    type="date"
                    value={pagamentoData}
                    onChange={(e) => setPagamentoData(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Forma</label>
                  <select
                    value={pagamentoForma}
                    onChange={(e) => setPagamentoForma(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {FORMAS_PAGAMENTO.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Observação <span className="text-foreground/40 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={pagamentoDescricao}
                  onChange={(e) => setPagamentoDescricao(e.target.value)}
                  placeholder="Ex: Pagamento parcial em dinheiro"
                  className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button type="button" onClick={() => setIsPagamentoModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-foreground/70 hover:bg-white/5">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pagamentoLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md flex items-center gap-1.5"
                >
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
              {/* Dados gerais da venda */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Data da Compra
                  </label>
                  <input
                    type="date"
                    value={vendaData}
                    onChange={(e) => setVendaData(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={vendaForma}
                    onChange={(e) => setVendaForma(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {FORMAS_PAGAMENTO.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {/* Nome do comprador */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-brand-400" />
                  Nome do Comprador
                  <span className="text-foreground/40 font-normal">(opcional — quem veio buscar)</span>
                </label>
                <input
                  type="text"
                  value={vendaNomeComprador}
                  onChange={(e) => setVendaNomeComprador(e.target.value)}
                  placeholder={`Ex: filho de ${selectedClient?.nome || 'cliente'}, irmã...`}
                  className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Lista de itens */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-foreground">
                    Itens da Compra <span className="text-rose-500">*</span>
                  </label>
                  {!editingPurchase && (
                    <button
                      type="button"
                      onClick={addVendaItem}
                      className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar item
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {vendaItens.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-card/50 rounded-xl p-2.5 border border-[var(--card-border)]">
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          required
                          value={item.descricao}
                          onChange={(e) => updateVendaItem(idx, 'descricao', e.target.value)}
                          placeholder="Descrição / Produto"
                          className="w-full h-9 px-3 rounded-lg bg-background border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 mb-1.5"
                        />
                        <div className="flex gap-2">
                          <div className="w-20">
                            <input
                              type="number"
                              min="1"
                              value={item.quantidade}
                              onChange={(e) => updateVendaItem(idx, 'quantidade', e.target.value)}
                              placeholder="Qtd"
                              className="w-full h-8 px-2 rounded-lg bg-background border border-[var(--card-border)] text-xs text-center font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                            <span className="text-[10px] text-foreground/40 text-center block mt-0.5">Qtd</span>
                          </div>
                          <div className="flex-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              required
                              value={item.valor}
                              onChange={(e) => updateVendaItem(idx, 'valor', e.target.value)}
                              placeholder="Valor unit."
                              className="w-full h-8 px-2 rounded-lg bg-background border border-[var(--card-border)] text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                            <span className="text-[10px] text-foreground/40 block mt-0.5">Valor unit. (R$)</span>
                          </div>
                          {item.quantidade && item.valor && (
                            <div className="flex items-center text-[11px] font-mono font-bold text-brand-400 self-start pt-1.5 whitespace-nowrap">
                              = R$ {((parseFloat(item.valor) || 0) * (parseInt(item.quantidade, 10) || 1)).toFixed(2).replace('.', ',')}
                            </div>
                          )}
                        </div>
                      </div>
                      {!editingPurchase && vendaItens.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVendaItem(idx)}
                          className="p-1.5 rounded-lg text-foreground/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors mt-0.5 shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status pago */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vendaPago}
                    onChange={(e) => setVendaPago(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-xs font-semibold text-foreground">Já está pago?</span>
                </label>

                {/* Total da venda */}
                <div className="text-right">
                  <span className="text-[10px] text-foreground/50 block">Total da venda</span>
                  <span className="font-mono font-extrabold text-base text-foreground">
                    R$ {vendaTotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button type="button" onClick={() => setIsPurchaseModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-foreground/70 hover:bg-white/5">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={purchaseModalLoading}
                  className="px-5 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 disabled:opacity-50 transition-all shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {purchaseModalLoading
                    ? 'Salvando...'
                    : editingPurchase
                    ? 'Salvar Alterações'
                    : `Lançar ${vendaItens.filter(i => i.descricao && i.valor).length} item(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
