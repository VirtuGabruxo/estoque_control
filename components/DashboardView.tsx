'use client';

import React, { useEffect, useState } from 'react';
import {
  Package,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Layers,
  Calendar,
  Clock,
  RefreshCw,
  Barcode,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export function DashboardView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    estoqueTotal: number;
    produtosRecentes: any[];
    graficoDias: any[];
    vencendo7Dias: { produtos_count: number; unidades: number };
    listaCriticos: any[];
    movimentacoesHoje: { entradas: number; saidas: number };
    topCategorias: any[];
  } | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-sm text-foreground/60">Carregando painel de controle...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estoque Total */}
        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
              Estoque Total
            </span>
            <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-foreground tracking-tight">
              {data?.estoqueTotal.toLocaleString('pt-BR') || 0}
            </p>
            <p className="text-xs text-foreground/60 mt-1 flex items-center gap-1">
              Unidades físicas disponíveis
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition-all pointer-events-none" />
        </div>

        {/* Vencendo em 7 dias */}
        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
              Vencendo em 7 Dias
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-amber-500 tracking-tight">
              {data?.vencendo7Dias?.unidades || 0}
            </p>
            <p className="text-xs text-foreground/60 mt-1">
              Em {data?.vencendo7Dias?.produtos_count || 0} produto(s) diferente(s)
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Entradas de Hoje */}
        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
              Entradas Hoje
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-emerald-500 tracking-tight">
              +{data?.movimentacoesHoje?.entradas || 0}
            </p>
            <p className="text-xs text-foreground/60 mt-1">
              Itens recebidos hoje
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Saídas de Hoje */}
        <div className="glass-panel p-5 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">
              Saídas Hoje
            </span>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-rose-500 tracking-tight">
              -{data?.movimentacoesHoje?.saidas || 0}
            </p>
            <p className="text-xs text-foreground/60 mt-1">
              Itens despachados hoje
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      </div>

      {/* Main Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de barras verticais por dia da semana */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-500" />
                Vencimentos por Dia da Semana (Próximos 7 Dias)
              </h3>
              <p className="text-xs text-foreground/60">
                Quantidade de unidades com validade expirando em cada dia
              </p>
            </div>
            <button
              onClick={loadDashboard}
              className="p-1.5 rounded-lg text-foreground/60 hover:text-brand-500 hover:bg-brand-500/10 transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.graficoDias || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="dia"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="glass-panel p-2.5 rounded-xl border border-[var(--card-border)] shadow-xl text-xs">
                          <p className="font-semibold text-foreground">{item.diaCompleto}</p>
                          <p className="text-brand-500 font-bold mt-1">
                            {item.quantidade} unidade(s) vencendo
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="quantidade" radius={[8, 8, 0, 0]}>
                  {(data?.graficoDias || []).map((entry: any, index: number) => {
                    const isUrgent = index <= 1 && entry.quantidade > 0;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isUrgent ? '#F43F5E' : 'var(--brand-500)'}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-end gap-4 mt-2 text-[11px] text-foreground/60">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Vencimento Imediato (Hoje/Amanhã)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500" /> Demais dias
            </span>
          </div>
        </div>

        {/* Top Categorias com mais itens */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between">
          <div className="mb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-500" />
              Top Categorias
            </h3>
            <p className="text-xs text-foreground/60">Setores com maior volume em estoque</p>
          </div>

          <div className="space-y-3.5 my-auto">
            {(!data?.topCategorias || data.topCategorias.length === 0) ? (
              <p className="text-xs text-foreground/50 text-center py-8">Nenhum estoque cadastrado ainda.</p>
            ) : (
              data.topCategorias.map((cat, idx) => {
                const total = data.estoqueTotal || 1;
                const percent = Math.min(100, Math.round((cat.total_unidades / total) * 100));
                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-brand-500/10 text-brand-500 text-[11px] flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        {cat.nome}
                      </span>
                      <span className="text-foreground/75 font-mono">
                        {cat.total_unidades} un. ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-[var(--card-border)]/50 text-center">
            <span className="text-[11px] text-foreground/50">Baseado no estoque ativo atual</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Products & Expiry Alerts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos cadastrados nos últimos dias */}
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-500" />
                Produtos Cadastrados Recentemente
              </h3>
              <p className="text-xs text-foreground/60">Últimos itens inseridos no sistema</p>
            </div>
          </div>

          <div className="divide-y divide-[var(--card-border)]/50">
            {(!data?.produtosRecentes || data.produtosRecentes.length === 0) ? (
              <p className="text-xs text-foreground/50 text-center py-8">Nenhum produto cadastrado ainda.</p>
            ) : (
              data.produtosRecentes.map((prod) => (
                <div key={prod.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
                      <Barcode className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{prod.nome}</p>
                      <p className="text-[11px] text-foreground/50 font-mono">
                        {prod.codigo_barras} • {prod.categoria_nome || 'Geral'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-brand-500/15 text-brand-500 font-mono">
                      {prod.estoque_atual} em estoque
                    </span>
                    {prod.proxima_validade && (
                      <p className="text-[10px] text-foreground/50 mt-0.5">
                        Val: {new Date(prod.proxima_validade).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lotes Críticos Vencendo nos Próximos 7 Dias */}
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Lotes Próximos do Vencimento
              </h3>
              <p className="text-xs text-foreground/60">Atenção prioritária aos produtos que vencem nesta semana</p>
            </div>
          </div>

          <div className="divide-y divide-[var(--card-border)]/50">
            {(!data?.listaCriticos || data.listaCriticos.length === 0) ? (
              <div className="py-8 text-center text-xs text-foreground/50 flex flex-col items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">✓</span>
                Nenhum lote vencendo nos próximos 7 dias. Tudo em dia!
              </div>
            ) : (
              data.listaCriticos.map((item, idx) => {
                const dataVal = new Date(item.data_validade);
                const hoje = new Date();
                hoje.setHours(0,0,0,0);
                const diffTime = dataVal.getTime() - hoje.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const isToday = diffDays <= 0;
                const is2Days = diffDays <= 2;

                return (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{item.nome}</p>
                      <p className="text-[11px] text-foreground/50">
                        {item.categoria_nome || 'Geral'} • {item.quantidade} un. no lote
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                          isToday
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                            : is2Days
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-white/10 text-foreground/80'
                        }`}
                      >
                        {isToday
                          ? 'Vence HOJE'
                          : diffDays === 1
                          ? 'Vence Amanhã'
                          : `Vence em ${diffDays} dias`}
                      </span>
                      <p className="text-[10px] text-foreground/50 mt-0.5">
                        {dataVal.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
