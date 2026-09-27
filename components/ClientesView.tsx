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
} from 'lucide-react';
import { Cliente, LancamentoFiado } from '@/lib/types';

const FORMAS_PAGAMENTO = [
  'Dinheiro',
  'Pix',
  'Cartão de crédito',
  'Cartão de débito',
];

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

  // Modal: Add / Edit Purchase Launch
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<LancamentoFiado | null>(null);
  const [purchaseDescricao, setPurchaseDescricao] = useState('');
  const [purchaseData, setPurchaseData] = useState(() => new Date().toISOString().split('T')[0]);
  const [purchaseQuantidade, setPurchaseQuantidade] = useState('1');
  const [purchaseValor, setPurchaseValor] = useState('');
  const [purchasePago, setPurchasePago] = useState(false);
  const [purchaseForma, setPurchaseForma] = useState('Dinheiro');
  const [purchaseModalLoading, setPurchaseModalLoading] = useState(false);

  // Load clients
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

  // Load purchases when client or month changes
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

  // Handle Add Client
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

  // Open modal to add purchase
  const handleOpenAddPurchase = () => {
    setEditingPurchase(null);
    setPurchaseDescricao('');
    setPurchaseData(new Date().toISOString().split('T')[0]);
    setPurchaseQuantidade('1');
    setPurchaseValor('');
    setPurchasePago(false);
    setPurchaseForma('Dinheiro');
    setIsPurchaseModalOpen(true);
  };

  // Open modal to edit purchase
  const handleOpenEditPurchase = (item: LancamentoFiado) => {
    setEditingPurchase(item);
    setPurchaseDescricao(item.descricao);
    setPurchaseData(item.data_compra);
    setPurchaseQuantidade(String(item.quantidade));
    setPurchaseValor(String(item.valor));
    setPurchasePago(item.pago);
    setPurchaseForma(item.forma_pagamento || 'Dinheiro');
    setIsPurchaseModalOpen(true);
  };

  // Save Purchase (Create or Update)
  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !purchaseDescricao.trim() || !purchaseValor) return;

    setPurchaseModalLoading(true);
    try {
      if (editingPurchase) {
        // Update
        const res = await fetch(`/api/clientes/${selectedClient.id}/compras`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingPurchase.id,
            descricao: purchaseDescricao.trim(),
            data_compra: purchaseData,
            quantidade: parseInt(purchaseQuantidade, 10) || 1,
            valor: parseFloat(purchaseValor),
            pago: purchasePago,
            forma_pagamento: purchaseForma,
          }),
        });
        if (res.ok) {
          setIsPurchaseModalOpen(false);
          loadClientPurchases(selectedClient.id, mesFiltro);
          loadClientes();
        }
      } else {
        // Create
        const res = await fetch(`/api/clientes/${selectedClient.id}/compras`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            descricao: purchaseDescricao.trim(),
            data_compra: purchaseData,
            quantidade: parseInt(purchaseQuantidade, 10) || 1,
            valor: parseFloat(purchaseValor),
            pago: purchasePago,
            forma_pagamento: purchaseForma,
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

  // Toggle paid status directly
  const handleTogglePaid = async (item: LancamentoFiado) => {
    if (!selectedClient) return;
    try {
      await fetch(`/api/clientes/${selectedClient.id}/compras`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          pago: !item.pago,
        }),
      });
      loadClientPurchases(selectedClient.id, mesFiltro);
      loadClientes();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Purchase
  const handleDeletePurchase = async (purchaseId: string) => {
    if (!selectedClient || !confirm('Deseja realmente excluir este lançamento?')) return;
    try {
      await fetch(`/api/clientes/${selectedClient.id}/compras?purchase_id=${purchaseId}`, {
        method: 'DELETE',
      });
      loadClientPurchases(selectedClient.id, mesFiltro);
      loadClientes();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredClientes = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.telefone && c.telefone.includes(searchTerm))
  );

  return (
    <div className="space-y-6 relative pb-20">
      {!selectedClient ? (
        /* ========================================== */
        /* LISTA PRINCIPAL DE CLIENTES DO FIADO       */
        /* ========================================== */
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
                            <span>Sem telefone cadastrado</span>
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
        /* ========================================== */
        /* TELA DE COMPRAS DO CLIENTE SELECIONADO     */
        /* ========================================== */
        <div className="glass-panel p-6 rounded-3xl space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--card-border)] gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 rounded-xl text-foreground/60 hover:text-foreground hover:bg-white/5 transition-colors"
                title="Voltar à lista de clientes"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-brand-500" />
                  Compras de {selectedClient.nome}
                </h3>
                <p className="text-xs text-foreground/60">
                  {selectedClient.telefone || 'Sem telefone'} • Cadastrado em{' '}
                  {new Date(selectedClient.criado_em).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Filtro por Mês */}
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

              <button
                onClick={handleOpenAddPurchase}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-500 text-white font-semibold text-xs hover:bg-brand-600 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Lançamento</span>
              </button>
            </div>
          </div>

          {/* Tabela de Lançamentos de Compras */}
          {loadingCompras ? (
            <div className="py-12 text-center text-xs text-foreground/50">Carregando compras...</div>
          ) : compras.length === 0 ? (
            <div className="py-12 text-center text-xs text-foreground/50">
              Nenhuma compra registrada para este cliente no mês selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--card-border)] text-foreground/60 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Descrição / Produto</th>
                    <th className="py-2.5 px-3 text-center">Qtd</th>
                    <th className="py-2.5 px-3">Valor</th>
                    <th className="py-2.5 px-3">Forma Pagto</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]/50">
                  {compras.map((c) => (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-mono text-foreground/75 whitespace-nowrap">
                        {new Date(c.data_compra + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 font-semibold text-foreground">{c.descricao}</td>
                      <td className="py-3 px-3 text-center font-mono">{c.quantidade}</td>
                      <td className="py-3 px-3 font-mono font-bold text-foreground">
                        R$ {Number(c.valor).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-3 px-3 text-foreground/70">
                        {c.forma_pagamento || '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
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
                      </td>
                      <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditPurchase(c)}
                          className="p-1.5 rounded-lg text-foreground/60 hover:text-brand-500 hover:bg-brand-500/10 transition-colors"
                          title="Editar lançamento"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePurchase(c.id)}
                          className="p-1.5 rounded-lg text-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Excluir lançamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Somatório de Dívidas no Final da Tela */}
          <div className="pt-4 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl">
            <div>
              <span className="text-xs text-foreground/60 block">Dívida Total Acumulada</span>
              <span className="text-xl font-extrabold text-rose-500 font-mono">
                R$ {somatorioDividaGeral.toFixed(2).replace('.', ',')}
              </span>
              {mesFiltro && (
                <span className="text-[11px] text-foreground/50 block">
                  (Pendente no mês {mesFiltro}: R$ {somatorioDividaMes.toFixed(2).replace('.', ',')})
                </span>
              )}
            </div>

            <button
              onClick={handleOpenAddPurchase}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Compra</span>
            </button>
          </div>
        </div>
      )}

      {/* Botão Flutuante "+" para Novo Cliente */}
      {!selectedClient && (
        <button
          onClick={() => setIsClientModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 rounded-full bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/30 hover:scale-105 active:scale-95"
          title="Cadastrar Novo Cliente"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Novo Cliente</span>
        </button>
      )}

      {/* Modal: Cadastrar Novo Cliente */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-[var(--card-border)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-500" />
                <h3 className="text-base font-bold text-foreground">Novo Cliente</h3>
              </div>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground"
              >
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
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-foreground/70 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={clientModalLoading}
                  className="px-5 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 disabled:opacity-50 transition-all shadow-md"
                >
                  {clientModalLoading ? 'Salvando...' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adicionar ou Editar Lançamento de Compra */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-[var(--card-border)] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-brand-500" />
                <h3 className="text-base font-bold text-foreground">
                  {editingPurchase ? 'Editar Lançamento' : 'Novo Lançamento de Compra'}
                </h3>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Descrição / Produto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={purchaseDescricao}
                  onChange={(e) => setPurchaseDescricao(e.target.value)}
                  placeholder="Ex: 2kg de carne moída, 1 fardo de refrigerante"
                  className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Data da Compra
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseData}
                    onChange={(e) => setPurchaseData(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purchaseQuantidade}
                    onChange={(e) => setPurchaseQuantidade(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Valor Total (R$) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={purchaseValor}
                    onChange={(e) => setPurchaseValor(e.target.value)}
                    placeholder="0,00"
                    className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={purchaseForma}
                    onChange={(e) => setPurchaseForma(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {FORMAS_PAGAMENTO.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Pago / Não Pago */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={purchasePago}
                    onChange={(e) => setPurchasePago(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-xs font-semibold text-foreground">
                    Já está pago?
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-foreground/70 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={purchaseModalLoading}
                  className="px-5 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 disabled:opacity-50 transition-all shadow-md"
                >
                  {purchaseModalLoading ? 'Salvando...' : 'Salvar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
