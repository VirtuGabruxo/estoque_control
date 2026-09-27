'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  UserCheck,
  Calendar,
  Package,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Movimentacao } from '@/lib/types';

export function HistoricoView() {
  const [filtroTipo, setFiltroTipo] = useState<'tudo' | 'entrada' | 'saida'>('tudo');
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistorico = async () => {
    setLoading(true);
    try {
      const url =
        filtroTipo === 'tudo'
          ? '/api/movimentacoes?limit=100'
          : `/api/movimentacoes?tipo=${filtroTipo}&limit=100`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMovimentacoes(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorico();
  }, [filtroTipo]);

  return (
    <div className="space-y-6">
      {/* Barra de Filtro de Histórico */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-brand-500" />
            Histórico de Movimentações
          </h3>
          <p className="text-xs text-foreground/60">
            Auditoria completa de entradas e saídas consolidadas por produto e assinadas por responsável.
          </p>
        </div>

        {/* Filtro: Tudo, Entrada, Saída */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-card border border-[var(--card-border)] w-fit">
          <button
            onClick={() => setFiltroTipo('tudo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filtroTipo === 'tudo'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
            }`}
          >
            Tudo ({movimentacoes.length})
          </button>

          <button
            onClick={() => setFiltroTipo('entrada')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filtroTipo === 'entrada'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            Entradas
          </button>

          <button
            onClick={() => setFiltroTipo('saida')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filtroTipo === 'saida'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Saídas
          </button>
        </div>
      </div>

      {/* Lista de Movimentações */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-foreground/50 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
            Carregando histórico...
          </div>
        ) : movimentacoes.length === 0 ? (
          <div className="py-16 text-center text-xs text-foreground/50 flex flex-col items-center gap-2">
            <History className="w-10 h-10 stroke-1 text-foreground/30" />
            Nenhuma movimentação registrada no histórico até o momento.
          </div>
        ) : (
          <div className="space-y-4">
            {movimentacoes.map((mov) => {
              const isEntrada = mov.tipo === 'entrada';
              const totalQtd = mov.itens?.reduce((acc, curr) => acc + curr.quantidade, 0) || 0;

              return (
                <div
                  key={mov.id}
                  className="p-5 rounded-2xl bg-white/5 border border-[var(--card-border)]/60 hover:border-brand-500/40 transition-all space-y-3"
                >
                  {/* Cabeçalho da Movimentação */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--card-border)]/50 gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          isEntrada
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isEntrada ? (
                          <>
                            <ArrowDownRight className="w-3.5 h-3.5" /> ENTRADA DE ESTOQUE
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5" /> SAÍDA DE ESTOQUE
                          </>
                        )}
                      </span>

                      <span className="text-xs text-foreground/60 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(mov.criado_em).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(mov.criado_em).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-foreground/60">Responsável Assinado:</span>
                      <span className="font-bold text-foreground flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-card border border-[var(--card-border)]">
                        <UserCheck className="w-3.5 h-3.5 text-brand-500" />
                        {mov.responsavel}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Produtos Movimentados (Consolidados conforme bipagens) */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider">
                      Itens Movimentados ({totalQtd} un. no total):
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {mov.itens?.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-card border border-[var(--card-border)] text-xs flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-foreground">{item.produto_nome}</p>
                            <p className="text-[10px] text-foreground/50 font-mono">
                              {item.codigo_barras}
                            </p>
                          </div>

                          <div className="text-right">
                            <span
                              className={`font-mono font-extrabold text-sm ${
                                isEntrada ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isEntrada ? `+${item.quantidade}` : `-${item.quantidade}`} un.
                            </span>
                            {item.estoque_anterior !== null && item.estoque_atual !== null && (
                              <p className="text-[10px] text-foreground/50">
                                {item.estoque_anterior} → {item.estoque_atual}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
