'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  Plus,
  Barcode,
  Calendar,
  Search,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Categoria, Produto } from '@/lib/types';

export function ProdutosView() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal de cadastro manual de produto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoCodigo, setNovoCodigo] = useState('');
  const [novaCategoriaId, setNovaCategoriaId] = useState('');
  const [novaValidade, setNovaValidade] = useState('');
  const [novaQuantidade, setNovaQuantidade] = useState('1');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Carregar categorias
  const loadCategorias = () => {
    fetch('/api/categorias')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategorias(data);
          if (data.length > 0 && !novaCategoriaId) {
            setNovaCategoriaId(data[0].id);
          }
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadCategorias();
  }, []);

  // Ao selecionar uma categoria, busca os produtos daquela categoria
  useEffect(() => {
    if (selectedCategoria) {
      setLoadingProdutos(true);
      fetch(`/api/produtos?categoria_id=${selectedCategoria.id}`)
        .then((r) => r.json())
        .then((data) => setProdutos(Array.isArray(data) ? data : []))
        .catch(console.error)
        .finally(() => setLoadingProdutos(false));
    }
  }, [selectedCategoria]);

  const handleCadastrarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!novoNome.trim() || !novoCodigo.trim() || !novaCategoriaId) {
      setModalError('Nome, código de barras e categoria são obrigatórios.');
      return;
    }

    setModalLoading(true);
    try {
      const res = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoNome.trim(),
          codigo_barras: novoCodigo.trim(),
          categoria_id: novaCategoriaId,
          data_validade: novaValidade || null,
          quantidade: parseInt(novaQuantidade, 10) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar produto.');
      }

      // Limpar formulário e fechar modal
      setNovoNome('');
      setNovoCodigo('');
      setNovaValidade('');
      setNovaQuantidade('1');
      setIsModalOpen(false);

      // Recarregar categorias e produtos
      loadCategorias();
      if (selectedCategoria && selectedCategoria.id === novaCategoriaId) {
        setProdutos((prev) => [data, ...prev]);
      }
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredProdutos = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo_barras.includes(searchTerm)
  );

  return (
    <div className="space-y-6 relative pb-20">
      {/* Visualização Principal: Nomes das Categorias Fixas */}
      {!selectedCategoria ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-500" />
                Categorias de Produtos
              </h3>
              <p className="text-xs text-foreground/60">
                Selecione uma categoria para visualizar seus produtos vinculados e validades.
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 font-semibold w-fit">
              {categorias.length} categorias cadastradas
            </span>
          </div>

          {/* Grid com apenas os nomes das categorias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categorias.map((cat) => (
              <div
                key={cat.id}
                onClick={() => setSelectedCategoria(cat)}
                className="glass-panel p-5 rounded-3xl cursor-pointer hover:border-brand-500/50 hover:shadow-brand-glow transition-all duration-200 group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground group-hover:text-brand-500 transition-colors">
                      {cat.nome}
                    </h4>
                    <p className="text-xs text-foreground/50">
                      {cat.total_produtos || 0} produto(s)
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-foreground/40 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Visualização Detalhada da Categoria Selecionada */
        <div className="glass-panel p-6 rounded-3xl space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--card-border)] gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedCategoria(null)}
                className="p-2 rounded-xl text-foreground/60 hover:text-foreground hover:bg-white/5 transition-colors"
                title="Voltar às categorias"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Package className="w-5 h-5 text-brand-500" />
                  {selectedCategoria.nome}
                </h3>
                <p className="text-xs text-foreground/60">
                  {produtos.length} produto(s) vinculado(s) a esta categoria
                </p>
              </div>
            </div>

            {/* Campo de Busca Rápida */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou código..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {loadingProdutos ? (
            <div className="py-12 text-center text-xs text-foreground/50">
              Carregando produtos...
            </div>
          ) : filteredProdutos.length === 0 ? (
            <div className="py-12 text-center text-xs text-foreground/50">
              Nenhum produto cadastrado nesta categoria ainda. Use o botão "+" no canto inferior para cadastrar.
            </div>
          ) : (
            <div className="divide-y divide-[var(--card-border)]/50">
              {filteredProdutos.map((prod) => (
                <div
                  key={prod.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
                      <Barcode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{prod.nome}</h4>
                      <p className="text-xs text-foreground/50 font-mono flex items-center gap-2">
                        <span>Código: {prod.codigo_barras}</span>
                        {prod.proxima_validade && (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Clock className="w-3 h-3" />
                            Val: {new Date(prod.proxima_validade).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:text-right">
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-brand-500/15 text-brand-500 font-mono">
                      {prod.estoque_total || 0} un. em estoque
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Botão Flutuante "+" no Canto Inferior Direito */}
      <button
        onClick={() => {
          if (selectedCategoria) {
            setNovaCategoriaId(selectedCategoria.id);
          }
          setIsModalOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 rounded-full bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/30 hover:scale-105 active:scale-95"
        title="Cadastrar Novo Produto Manualmente"
      >
        <Plus className="w-5 h-5" />
        <span className="hidden sm:inline">Cadastrar Produto</span>
      </button>

      {/* Modal de Cadastro Manual de Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-[var(--card-border)] shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-500" />
                <h3 className="text-base font-bold text-foreground">Novo Produto</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCadastrarProduto} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nome do Produto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Leite Integral 1L"
                  className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Código de Barras <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={novoCodigo}
                  onChange={(e) => setNovoCodigo(e.target.value)}
                  placeholder="Ex: 7891234567890"
                  className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Categoria <span className="text-rose-500">*</span>
                </label>
                <select
                  value={novaCategoriaId}
                  onChange={(e) => setNovaCategoriaId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Validade Inicial
                  </label>
                  <input
                    type="date"
                    value={novaValidade}
                    onChange={(e) => setNovaValidade(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Estoque Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={novaQuantidade}
                    onChange={(e) => setNovaQuantidade(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-foreground/70 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 disabled:opacity-50 transition-all shadow-md"
                >
                  {modalLoading ? 'Salvando...' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
