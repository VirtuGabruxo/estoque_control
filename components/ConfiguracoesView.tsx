'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Palette,
  Sun,
  Moon,
  Users,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  Check,
  CreditCard,
} from 'lucide-react';
import { useTheme, PrimaryColor, colorPalettes } from '@/lib/theme-context';
import { User, Funcionario, Categoria } from '@/lib/types';

interface ConfiguracoesViewProps {
  currentUser: User | null;
  onConfigChanged?: () => void;
}

export function ConfiguracoesView({ currentUser, onConfigChanged }: ConfiguracoesViewProps) {
  const { mode, primaryColor, setMode, setPrimaryColor } = useTheme();

  const [moduloClientes, setModuloClientes] = useState(true);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // Funcionário form
  const [novoFuncionarioNome, setNovoFuncionarioNome] = useState('');
  const [funcLoading, setFuncLoading] = useState(false);

  // Categoria form
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [catLoading, setCatLoading] = useState(false);

  // Feedback message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = currentUser?.papel === 'administrador';

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/configuracoes');
      if (res.ok) {
        const data = await res.json();
        setModuloClientes(data.modulo_clientes);
        setFuncionarios(data.funcionarios || []);
        setCategorias(data.categorias || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Alterar tema ou cor primária
  const handleThemeChange = async (newMode: 'escuro' | 'claro') => {
    setMode(newMode);
    if (!isAdmin) return;
    try {
      await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_settings', tema: newMode }),
      });
      showFeedback('success', `Tema ${newMode} salvo como padrão do sistema.`);
    } catch (e) {}
  };

  const handleColorChange = async (colorKey: PrimaryColor) => {
    setPrimaryColor(colorKey);
    if (!isAdmin) return;
    try {
      await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_settings', cor_primaria: colorKey }),
      });
      showFeedback('success', `Cor primária alterada para ${colorPalettes[colorKey].name}.`);
    } catch (e) {}
  };

  const handleToggleModuloClientes = async () => {
    if (!isAdmin) {
      showFeedback('error', 'Apenas administradores podem alterar configurações do sistema.');
      return;
    }
    const novoValor = !moduloClientes;
    setModuloClientes(novoValor);
    try {
      await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_settings', modulo_clientes: novoValor }),
      });
      showFeedback('success', `Módulo de Clientes (Fiado) ${novoValor ? 'ativado' : 'desativado'}.`);
      if (onConfigChanged) onConfigChanged();
    } catch (e) {}
  };

  // Funcionários
  const handleAddFuncionario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showFeedback('error', 'Apenas administradores podem gerenciar funcionários.');
      return;
    }
    if (!novoFuncionarioNome.trim()) return;

    setFuncLoading(true);
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_funcionario', nome: novoFuncionarioNome.trim() }),
      });
      if (res.ok) {
        const novo = await res.json();
        setFuncionarios((prev) => [...prev, novo]);
        setNovoFuncionarioNome('');
        showFeedback('success', `Funcionário "${novo.nome}" cadastrado com sucesso.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFuncLoading(false);
    }
  };

  const handleToggleFuncionario = async (f: Funcionario) => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_funcionario', id: f.id, ativo: !f.ativo }),
      });
      if (res.ok) {
        setFuncionarios((prev) =>
          prev.map((item) => (item.id === f.id ? { ...item, ativo: !item.ativo } : item))
        );
      }
    } catch (e) {}
  };

  const handleDeleteFuncionario = async (id: string, nome: string) => {
    if (!isAdmin) return;
    if (!confirm(`Deseja realmente remover o funcionário "${nome}"?`)) return;
    try {
      await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_funcionario', id }),
      });
      setFuncionarios((prev) => prev.filter((item) => item.id !== id));
      showFeedback('success', `Funcionário removido.`);
    } catch (e) {}
  };

  // Categorias
  const handleAddCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showFeedback('error', 'Apenas administradores podem adicionar categorias.');
      return;
    }
    if (!novaCategoriaNome.trim()) return;

    setCatLoading(true);
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_categoria', nome: novaCategoriaNome.trim() }),
      });
      if (res.ok) {
        const nova = await res.json();
        setCategorias((prev) => [...prev, { ...nova, total_produtos: 0 }]);
        setNovaCategoriaNome('');
        showFeedback('success', `Categoria "${nova.nome}" adicionada com sucesso.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategoria = async (c: Categoria) => {
    if (!isAdmin) return;
    if (c.total_produtos && c.total_produtos > 0) {
      alert(`Esta categoria possui ${c.total_produtos} produto(s) vinculado(s) e não pode ser excluída.`);
      return;
    }

    if (!confirm(`Deseja realmente remover a categoria "${c.nome}"?`)) return;

    try {
      const res = await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_categoria', id: c.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        showFeedback('error', data.error || 'Erro ao excluir categoria.');
      } else {
        setCategorias((prev) => prev.filter((item) => item.id !== c.id));
        showFeedback('success', `Categoria "${c.nome}" excluída.`);
      }
    } catch (e: any) {
      showFeedback('error', e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerta de Papel caso seja convidado */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-400 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500" />
          <div>
            <span className="font-bold">Acesso Convidado:</span> Você possui permissão para navegar e visualizar as configurações, mas apenas administradores podem salvar modificações no banco de dados.
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 1. SEÇÃO: TEMA E IDENTIDADE VISUAL */}
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        <div className="pb-3 border-b border-[var(--card-border)]">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Palette className="w-5 h-5 text-brand-500" />
            Tema e Identidade Visual
          </h3>
          <p className="text-xs text-foreground/60">
            Interface moderna com tema escuro (traços escuros) e tema claro (traços claros), e paleta personalizável de cores primárias.
          </p>
        </div>

        {/* Alternância de Modo Claro / Escuro */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-foreground">
            Modo de Visualização
          </label>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              onClick={() => handleThemeChange('escuro')}
              className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                mode === 'escuro'
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25 border-brand-500'
                  : 'bg-card border-[var(--card-border)] text-foreground/70 hover:bg-white/5'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Tema Escuro</span>
            </button>

            <button
              onClick={() => handleThemeChange('claro')}
              className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                mode === 'claro'
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25 border-brand-500'
                  : 'bg-card border-[var(--card-border)] text-foreground/70 hover:bg-white/5'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Tema Claro</span>
            </button>
          </div>
        </div>

        {/* Troca de Cor Primária (Paleta) */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-semibold text-foreground">
            Cor Primária do Sistema (Substitui o Azul Padrão)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {(Object.keys(colorPalettes) as PrimaryColor[]).map((key) => {
              const pal = colorPalettes[key];
              const isSelected = primaryColor === key;

              return (
                <button
                  key={key}
                  onClick={() => handleColorChange(key)}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    isSelected
                      ? 'border-white ring-2 ring-brand-500 shadow-md scale-105'
                      : 'border-[var(--card-border)] hover:bg-white/5 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full shadow-inner flex items-center justify-center text-white"
                    style={{ backgroundColor: pal.hex }}
                  >
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                  <span className="text-[11px] font-semibold text-foreground text-center">
                    {pal.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. SEÇÃO: MÓDULO CLIENTES (FIADO) */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-500" />
              Módulo de Vendas Fiadas
            </h3>
            <p className="text-xs text-foreground/60">
              Controle se a guia de clientes e vendas fiadas fica visível no menu lateral.
            </p>
          </div>

          <button
            onClick={handleToggleModuloClientes}
            className={`p-2 rounded-2xl transition-all ${
              moduloClientes ? 'text-brand-500' : 'text-foreground/40'
            }`}
            title={moduloClientes ? 'Desativar Módulo' : 'Ativar Módulo'}
          >
            {moduloClientes ? (
              <ToggleRight className="w-8 h-8" />
            ) : (
              <ToggleLeft className="w-8 h-8" />
            )}
          </button>
        </div>
        <p className="text-xs text-foreground/70">
          Status atual:{' '}
          <span className="font-bold text-foreground">
            {moduloClientes ? 'Ativado (Exibido no menu lateral)' : 'Desativado (Oculto)'}
          </span>
        </p>
      </div>

      {/* 3. SEÇÃO: FUNCIONÁRIOS */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="pb-3 border-b border-[var(--card-border)]">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-500" />
            Gestão de Funcionários
          </h3>
          <p className="text-xs text-foreground/60">
            Cadastre os colaboradores para aparecerem no seletor de responsável das movimentações de estoque.
          </p>
        </div>

        {/* Adicionar funcionário */}
        {isAdmin && (
          <form onSubmit={handleAddFuncionario} className="flex gap-2 max-w-md">
            <input
              type="text"
              value={novoFuncionarioNome}
              onChange={(e) => setNovoFuncionarioNome(e.target.value)}
              placeholder="Nome do novo funcionário..."
              className="flex-1 h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={funcLoading || !novoFuncionarioNome.trim()}
              className="flex items-center gap-1 px-4 h-10 rounded-xl bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 disabled:opacity-50 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </form>
        )}

        {/* Lista de Funcionários */}
        <div className="divide-y divide-[var(--card-border)]/50 rounded-2xl border border-[var(--card-border)] overflow-hidden">
          {funcionarios.length === 0 ? (
            <div className="p-6 text-center text-xs text-foreground/50">
              Nenhum funcionário cadastrado. O campo de responsável operará como texto livre.
            </div>
          ) : (
            funcionarios.map((f) => (
              <div key={f.id} className="p-3.5 bg-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{f.nome}</p>
                    <span
                      className={`text-[10px] font-semibold ${
                        f.ativo ? 'text-emerald-400' : 'text-foreground/40'
                      }`}
                    >
                      {f.ativo ? 'Ativo no sistema' : 'Inativo'}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleFuncionario(f)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        f.ativo
                          ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                          : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                      }`}
                    >
                      {f.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleDeleteFuncionario(f.id, f.nome)}
                      className="p-1.5 rounded-lg text-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Excluir funcionário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. SEÇÃO: CATEGORIAS FIXAS */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="pb-3 border-b border-[var(--card-border)]">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-500" />
            Gerenciamento de Categorias
          </h3>
          <p className="text-xs text-foreground/60">
            Categorias são a base fixa do catálogo. Não é permitido excluir categorias que contenham produtos cadastrados.
          </p>
        </div>

        {/* Adicionar categoria */}
        {isAdmin && (
          <form onSubmit={handleAddCategoria} className="flex gap-2 max-w-md">
            <input
              type="text"
              value={novaCategoriaNome}
              onChange={(e) => setNovaCategoriaNome(e.target.value)}
              placeholder="Nome da nova categoria..."
              className="flex-1 h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={catLoading || !novaCategoriaNome.trim()}
              className="flex items-center gap-1 px-4 h-10 rounded-xl bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 disabled:opacity-50 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </form>
        )}

        {/* Lista de Categorias com Contagem de Produtos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {categorias.map((c) => (
            <div
              key={c.id}
              className="p-3.5 rounded-2xl bg-white/5 border border-[var(--card-border)] flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-bold text-foreground">{c.nome}</p>
                <p className="text-[11px] text-foreground/50">
                  {c.total_produtos || 0} produto(s) vinculado(s)
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => handleDeleteCategoria(c)}
                  disabled={(c.total_produtos || 0) > 0}
                  className="p-1.5 rounded-lg text-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 disabled:opacity-20 disabled:hover:text-foreground/40 transition-colors"
                  title={
                    (c.total_produtos || 0) > 0
                      ? 'Não pode excluir: possui produtos vinculados'
                      : 'Excluir categoria'
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
