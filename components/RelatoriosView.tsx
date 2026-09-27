'use client';

import React, { useState, useEffect } from 'react';
import {
  FileBarChart2,
  Calendar,
  Layers,
  Printer,
  Download,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Barcode,
} from 'lucide-react';
import { Categoria } from '@/lib/types';

export function RelatoriosView() {
  const [modo, setModo] = useState<'geral' | 'validade'>('geral');
  const [diasAtalho, setDiasAtalho] = useState<string>('30');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [categoriaId, setCategoriaId] = useState('todas');
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [loading, setLoading] = useState(false);
  const [relatorioData, setRelatorioData] = useState<any>(null);

  // Load categories for filter
  useEffect(() => {
    fetch('/api/categorias')
      .then((r) => r.json())
      .then((data) => setCategorias(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const fetchRelatorio = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('modo', modo);

      if (categoriaId !== 'todas') {
        params.append('categoria_id', categoriaId);
      }

      if (dataInicio && dataFim) {
        params.append('data_inicio', dataInicio);
        params.append('data_fim', dataFim);
      } else if (diasAtalho) {
        params.append('dias', diasAtalho);
      }

      const res = await fetch(`/api/relatorios?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setRelatorioData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelatorio();
  }, [modo, diasAtalho, categoriaId]);

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    if (dataInicio && dataFim) {
      setDiasAtalho('');
      fetchRelatorio();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!relatorioData || !relatorioData.dados || relatorioData.dados.length === 0) return;

    let headers: string[] = [];
    let rows: string[][] = [];

    if (modo === 'validade') {
      headers = ['Produto', 'Código de Barras', 'Categoria', 'Data Validade', 'Dias Restantes', 'Quantidade no Lote'];
      rows = relatorioData.dados.map((d: any) => [
        `"${d.produto_nome}"`,
        `"${d.codigo_barras}"`,
        `"${d.categoria_nome || ''}"`,
        `"${new Date(d.data_validade).toLocaleDateString('pt-BR')}"`,
        d.dias_ate_vencimento,
        d.quantidade,
      ]);
    } else {
      headers = ['Data/Hora', 'Tipo', 'Responsável', 'Produto', 'Código', 'Categoria', 'Quantidade', 'Estoque Anterior', 'Estoque Atual'];
      rows = relatorioData.dados.map((d: any) => [
        `"${new Date(d.data_hora).toLocaleString('pt-BR')}"`,
        d.tipo === 'entrada' ? 'Entrada' : 'Saída',
        `"${d.responsavel}"`,
        `"${d.produto_nome}"`,
        `"${d.codigo_barras}"`,
        `"${d.categoria_nome || ''}"`,
        d.quantidade,
        d.estoque_anterior ?? '',
        d.estoque_atual ?? '',
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_${modo}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Controles de Filtros e Modos */}
      <div className="glass-panel p-6 rounded-3xl space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--card-border)] gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileBarChart2 className="w-5 h-5 text-brand-500" />
              Parâmetros do Relatório
            </h3>
            <p className="text-xs text-foreground/60">
              Configure o modo de análise, período e filtros por categoria.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-[var(--card-border)] text-xs font-semibold text-foreground hover:bg-white/5 transition-colors"
            >
              <Printer className="w-4 h-4 text-brand-500" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Seleção do Modo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => setModo('geral')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              modo === 'geral'
                ? 'bg-brand-500/10 border-brand-500 text-foreground shadow-md'
                : 'border-[var(--card-border)] hover:bg-white/5 text-foreground/70'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <ArrowDownRight className="w-4 h-4 text-brand-500" />
              Relatório Geral (Movimentações do Período)
            </div>
            <p className="text-[11px] text-foreground/50 mt-1">
              Consolidação de todas as entradas e saídas realizadas no período selecionado.
            </p>
          </button>

          <button
            onClick={() => setModo('validade')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              modo === 'validade'
                ? 'bg-amber-500/10 border-amber-500 text-foreground shadow-md'
                : 'border-[var(--card-border)] hover:bg-white/5 text-foreground/70'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs text-amber-500">
              <Clock className="w-4 h-4" />
              Relatório por Prazo de Validade (FEFO)
            </div>
            <p className="text-[11px] text-foreground/50 mt-1">
              Lista de itens em estoque ordenados pelos lotes mais próximos do vencimento.
            </p>
          </button>
        </div>

        {/* Linha de Filtros: Atalhos de dias, datas customizadas e categorias */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
          {/* Atalhos Rápidos */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Atalhos de Período
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['7', '15', '30', '60', '90'].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDiasAtalho(d);
                    setDataInicio('');
                    setDataFim('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    diasAtalho === d
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-card border border-[var(--card-border)] text-foreground/70 hover:bg-white/5'
                  }`}
                >
                  {d} dias
                </button>
              ))}
            </div>
          </div>

          {/* Calendário com Datas Específicas */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Ou escolha o período no calendário
            </label>
            <form onSubmit={handleApplyCustomDates} className="flex items-center gap-1.5">
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full h-8 px-2 rounded-xl bg-card border border-[var(--card-border)] text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <span className="text-foreground/40 text-xs">até</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full h-8 px-2 rounded-xl bg-card border border-[var(--card-border)] text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="px-2.5 h-8 rounded-xl bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 transition-colors"
                title="Filtrar"
              >
                Filtrar
              </button>
            </form>
          </div>

          {/* Escopo de Categoria */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Escopo por Categoria
            </label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full h-8 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="todas">Todos os Produtos e Categorias</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resultados do Relatório (Área de Impressão) */}
      <div className="glass-panel p-6 rounded-3xl space-y-4 print-area">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
          <div>
            <h4 className="text-sm font-bold text-foreground">
              {modo === 'validade'
                ? 'Relatório por Prazo de Validade (Itens mais próximos primeiro)'
                : 'Relatório Consolidado de Movimentações'}
            </h4>
            <p className="text-xs text-foreground/60">
              Emitido em {new Date().toLocaleDateString('pt-BR')} às{' '}
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {modo === 'geral' && relatorioData?.resumo && (
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-emerald-400 font-bold">
                +{relatorioData.resumo.totalEntradas} entradas
              </span>
              <span className="text-rose-400 font-bold">
                -{relatorioData.resumo.totalSaidas} saídas
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-foreground/50 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
            Carregando dados do relatório...
          </div>
        ) : !relatorioData?.dados || relatorioData.dados.length === 0 ? (
          <div className="py-16 text-center text-xs text-foreground/50">
            Nenhum registro encontrado para os filtros selecionados.
          </div>
        ) : modo === 'validade' ? (
          /* TABELA DE VALIDADE */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-foreground/60 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Validade</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Produto</th>
                  <th className="py-2.5 px-3">Código de Barras</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-right">Qtd no Lote</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]/50">
                {relatorioData.dados.map((row: any, i: number) => {
                  const dias = row.dias_ate_vencimento;
                  const isVencido = dias < 0;
                  const isHoje = dias === 0;
                  const isCritico = dias > 0 && dias <= 7;

                  return (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                        {new Date(row.data_validade + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isVencido
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : isHoje
                              ? 'bg-rose-500 text-white animate-pulse'
                              : isCritico
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {isVencido
                            ? `Vencido há ${Math.abs(dias)}d`
                            : isHoje
                            ? 'Vence HOJE'
                            : `${dias} dias`}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-foreground">{row.produto_nome}</td>
                      <td className="py-3 px-3 font-mono text-foreground/70">{row.codigo_barras}</td>
                      <td className="py-3 px-3 text-foreground/70">{row.categoria_nome || '—'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                        {row.quantidade} un.
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* TABELA GERAL DE MOVIMENTAÇÕES */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-foreground/60 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Data/Hora</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Responsável</th>
                  <th className="py-2.5 px-3">Produto</th>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3 text-center">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Estoque Ant. → Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]/50">
                {relatorioData.dados.map((row: any, i: number) => {
                  const isEntrada = row.tipo === 'entrada';

                  return (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-mono text-foreground/70 whitespace-nowrap">
                        {new Date(row.data_hora).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isEntrada
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isEntrada ? (
                            <>
                              <ArrowDownRight className="w-3 h-3" /> Entrada
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3" /> Saída
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-foreground">{row.responsavel}</td>
                      <td className="py-3 px-3 font-semibold text-foreground">{row.produto_nome}</td>
                      <td className="py-3 px-3 font-mono text-foreground/60">{row.codigo_barras}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {isEntrada ? `+${row.quantidade}` : `-${row.quantidade}`}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-foreground/75">
                        {row.estoque_anterior !== null && row.estoque_atual !== null
                          ? `${row.estoque_anterior} → ${row.estoque_atual}`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
