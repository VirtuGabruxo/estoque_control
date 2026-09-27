'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Barcode,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Calendar,
  Layers,
  Sparkles,
  UserCheck,
  Check,
  RotateCcw,
} from 'lucide-react';
import { BarcodeScannerInput } from './BarcodeScannerInput';
import { sound } from '@/lib/sound';
import { Categoria, Funcionario } from '@/lib/types';

interface ItemEntrada {
  tempId: string;
  codigo_barras: string;
  produto_id?: string;
  nome: string;
  categoria_id: string;
  data_validade: string;
  quantidade: number;
  isNovo: boolean;
}

interface ItemSaida {
  tempId: string;
  codigo_barras: string;
  produto_id: string;
  nome: string;
  quantidade: number;
}

interface ResultadoSaida {
  produto_id: string;
  produto_nome: string;
  codigo_barras: string;
  quantidade_saida: number;
  estoque_anterior: number;
  estoque_atual: number;
}

export function MovimentacaoView() {
  const [tab, setTab] = useState<'entrada' | 'saida'>('entrada');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [responsavel, setResponsavel] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Lists of items for Entrada and Saída
  const [itensEntrada, setItensEntrada] = useState<ItemEntrada[]>([]);
  const [itensSaida, setItensSaida] = useState<ItemSaida[]>([]);

  // Modal of final result after confirmed Saída
  const [resultadoSaidaModal, setResultadoSaidaModal] = useState<{
    movimentacao_id: string;
    responsavel: string;
    itens: ResultadoSaida[];
  } | null>(null);

  // Load categories and employees
  useEffect(() => {
    fetch('/api/categorias')
      .then((r) => r.json())
      .then((data) => setCategorias(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch('/api/funcionarios')
      .then((r) => r.json())
      .then((data) => {
        const funcs = Array.isArray(data) ? data : [];
        setFuncionarios(funcs);
        if (funcs.length > 0 && !responsavel) {
          setResponsavel(funcs[0].nome);
        }
      })
      .catch(console.error);
  }, []);

  // Set default expiry date (e.g., 3 months from now)
  const getDefaultExpiry = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  };

  // ==========================================
  // BIPAGEM NA ENTRADA
  // ==========================================
  const handleScanEntrada = async (barcode: string) => {
    setFeedbackMsg(null);

    // 1. Regra de agregação: se já está na lista atual, apenas incrementa quantidade
    const indexExistente = itensEntrada.findIndex((i) => i.codigo_barras === barcode);
    if (indexExistente !== -1) {
      setItensEntrada((prev) =>
        prev.map((item, idx) =>
          idx === indexExistente
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      );
      sound.beepAggregated();
      setFeedbackMsg({
        type: 'success',
        text: `+1 unidade somada ao produto "${itensEntrada[indexExistente].nome || barcode}" (Total: ${itensEntrada[indexExistente].quantidade + 1}).`,
      });
      return;
    }

    // 2. Não está na lista atual: busca no banco de dados se já foi cadastrado anteriormente
    sound.beep();
    try {
      const res = await fetch(`/api/produtos?codigo_barras=${encodeURIComponent(barcode)}`);
      if (res.ok) {
        const prod = await res.json();
        if (prod && prod.id) {
          // Produto já cadastrado no sistema
          const novoItem: ItemEntrada = {
            tempId: Math.random().toString(36).substring(7),
            codigo_barras: barcode,
            produto_id: prod.id,
            nome: prod.nome,
            categoria_id: prod.categoria_id,
            data_validade: getDefaultExpiry(),
            quantidade: 1,
            isNovo: false,
          };
          setItensEntrada((prev) => [novoItem, ...prev]);
          setFeedbackMsg({
            type: 'success',
            text: `Produto "${prod.nome}" identificado. Informe a validade deste lote.`,
          });
          return;
        }
      }

      // Produto NOVO (primeira vez no sistema)
      const novoItem: ItemEntrada = {
        tempId: Math.random().toString(36).substring(7),
        codigo_barras: barcode,
        nome: '',
        categoria_id: categorias[0]?.id || '',
        data_validade: getDefaultExpiry(),
        quantidade: 1,
        isNovo: true,
      };
      setItensEntrada((prev) => [novoItem, ...prev]);
      setFeedbackMsg({
        type: 'success',
        text: `Código novo detectado! Preencha o nome, categoria e validade para cadastrar.`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  // ==========================================
  // BIPAGEM NA SAÍDA
  // ==========================================
  const handleScanSaida = async (barcode: string) => {
    setFeedbackMsg(null);

    // 1. Regra de agregação: se já está na lista atual, apenas incrementa quantidade
    const indexExistente = itensSaida.findIndex((i) => i.codigo_barras === barcode);
    if (indexExistente !== -1) {
      setItensSaida((prev) =>
        prev.map((item, idx) =>
          idx === indexExistente
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      );
      sound.beepAggregated();
      setFeedbackMsg({
        type: 'success',
        text: `+1 unidade somada para saída de "${itensSaida[indexExistente].nome}" (Total: ${itensSaida[indexExistente].quantidade + 1}).`,
      });
      return;
    }

    // 2. Não está na lista atual: busca no banco
    sound.beep();
    try {
      const res = await fetch(`/api/produtos?codigo_barras=${encodeURIComponent(barcode)}`);
      if (res.ok) {
        const prod = await res.json();
        if (prod && prod.id) {
          // Adiciona item exibindo APENAS nome do produto e quantidade (sem subtrair e sem exibir estoque anterior/atual)
          const novoItem: ItemSaida = {
            tempId: Math.random().toString(36).substring(7),
            codigo_barras: barcode,
            produto_id: prod.id,
            nome: prod.nome,
            quantidade: 1,
          };
          setItensSaida((prev) => [novoItem, ...prev]);
          setFeedbackMsg({
            type: 'success',
            text: `"${prod.nome}" adicionado à lista de saída.`,
          });
          return;
        }
      }

      sound.buzzError();
      setFeedbackMsg({
        type: 'error',
        text: `Código "${barcode}" não encontrado no catálogo de produtos.`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  // ==========================================
  // CONFIRMAÇÃO DE ENTRADA
  // ==========================================
  const handleConfirmarEntrada = async () => {
    if (!responsavel.trim()) {
      alert('Por favor, informe o nome do responsável pela ação.');
      return;
    }

    if (itensEntrada.length === 0) {
      alert('Nenhum produto adicionado para entrada.');
      return;
    }

    // Validação de campos obrigatórios
    for (const item of itensEntrada) {
      if (!item.nome.trim()) {
        alert(`O produto com código "${item.codigo_barras}" precisa de um nome.`);
        return;
      }
      if (!item.categoria_id) {
        alert(`Selecione uma categoria para o produto "${item.nome}".`);
        return;
      }
      if (!item.data_validade) {
        alert(`Informe a data de validade para o produto "${item.nome}".`);
        return;
      }
      if (item.quantidade <= 0) {
        alert(`A quantidade do produto "${item.nome}" deve ser maior que zero.`);
        return;
      }
    }

    setLoading(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/movimentacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'entrada',
          responsavel: responsavel.trim(),
          funcionario_id: funcionarios.find((f) => f.nome === responsavel)?.id || null,
          itens: itensEntrada.map((i) => ({
            produto_id: i.produto_id,
            codigo_barras: i.codigo_barras,
            nome: i.nome,
            categoria_id: i.categoria_id,
            data_validade: i.data_validade,
            quantidade: i.quantidade,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar entrada.');
      }

      sound.chimeSuccess();
      setFeedbackMsg({
        type: 'success',
        text: `Entrada registrada com sucesso! ${itensEntrada.length} produto(s) atualizados no estoque.`,
      });
      setItensEntrada([]);
    } catch (e: any) {
      sound.buzzError();
      setFeedbackMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CONFIRMAÇÃO DE SAÍDA (FEFO)
  // ==========================================
  const handleConfirmarSaida = async () => {
    if (!responsavel.trim()) {
      alert('Por favor, informe o nome do responsável pela ação.');
      return;
    }

    if (itensSaida.length === 0) {
      alert('Nenhum produto adicionado para saída.');
      return;
    }

    for (const item of itensSaida) {
      if (item.quantidade <= 0) {
        alert(`A quantidade do produto "${item.nome}" deve ser maior que zero.`);
        return;
      }
    }

    setLoading(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/movimentacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'saida',
          responsavel: responsavel.trim(),
          funcionario_id: funcionarios.find((f) => f.nome === responsavel)?.id || null,
          itens: itensSaida.map((i) => ({
            produto_id: i.produto_id,
            codigo_barras: i.codigo_barras,
            nome: i.nome,
            quantidade: i.quantidade,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar saída.');
      }

      sound.chimeSuccess();
      // Exibe a tela de resultado final: Estoque anterior, Estoque atual e Nome do produto
      setResultadoSaidaModal({
        movimentacao_id: data.movimentacao_id,
        responsavel: data.responsavel,
        itens: data.resultados || [],
      });

      setItensSaida([]);
    } catch (e: any) {
      sound.buzzError();
      setFeedbackMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-3 p-1.5 rounded-2xl glass-panel border border-[var(--card-border)] w-fit">
        <button
          onClick={() => {
            setTab('entrada');
            setFeedbackMsg(null);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            tab === 'entrada'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
              : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>Aba Entrada de Estoque</span>
        </button>

        <button
          onClick={() => {
            setTab('saida');
            setFeedbackMsg(null);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            tab === 'saida'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
              : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Aba Saída de Estoque</span>
        </button>
      </div>

      {/* Barcode Scanner Box */}
      <div className="glass-panel p-5 rounded-3xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Barcode className="w-5 h-5 text-brand-500" />
              Leitor de Código de Barras — {tab === 'entrada' ? 'Entrada' : 'Saída'}
            </h3>
            <p className="text-xs text-foreground/60">
              Biper o mesmo código repetidas vezes incrementa a quantidade automaticamente na mesma linha.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Agregação automática ativa
          </div>
        </div>

        <BarcodeScannerInput
          onScan={tab === 'entrada' ? handleScanEntrada : handleScanSaida}
          placeholder={
            tab === 'entrada'
              ? 'Bipe o código do produto que está chegando no estoque...'
              : 'Bipe o código do produto para adicionar à saída...'
          }
        />

        {feedbackMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* ABA ENTRADA: TABELA DE ITENS ACUMULADOS   */}
      {/* ========================================== */}
      {tab === 'entrada' && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Itens para Entrada ({itensEntrada.length})
              </h4>
              <p className="text-xs text-foreground/60">
                Ajuste os dados antes de confirmar a movimentação única.
              </p>
            </div>
            {itensEntrada.length > 0 && (
              <button
                onClick={() => setItensEntrada([])}
                className="text-xs text-foreground/60 hover:text-rose-500 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar lista
              </button>
            )}
          </div>

          {itensEntrada.length === 0 ? (
            <div className="py-12 text-center text-xs text-foreground/50 flex flex-col items-center gap-2">
              <Barcode className="w-10 h-10 stroke-1 text-foreground/30 animate-pulse" />
              Nenhum item bipado ainda. Use o leitor de código de barras acima.
            </div>
          ) : (
            <div className="space-y-3">
              {itensEntrada.map((item, idx) => (
                <div
                  key={item.tempId}
                  className="p-4 rounded-2xl bg-white/5 border border-[var(--card-border)]/60 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                >
                  {/* Código e Tag */}
                  <div className="md:col-span-3">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-500/15 text-brand-400">
                      {item.codigo_barras}
                    </span>
                    {item.isNovo && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold">
                        Novo
                      </span>
                    )}
                  </div>

                  {/* Nome do produto (editável) */}
                  <div className="md:col-span-3">
                    <label className="block text-[11px] text-foreground/60 mb-1">Nome do Produto</label>
                    <input
                      type="text"
                      value={item.nome}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItensEntrada((prev) =>
                          prev.map((i, iIdx) => (iIdx === idx ? { ...i, nome: val } : i))
                        );
                      }}
                      placeholder="Ex: Arroz Tio João 5kg"
                      className="w-full h-9 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  {/* Categoria */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-foreground/60 mb-1">Categoria</label>
                    <select
                      value={item.categoria_id}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItensEntrada((prev) =>
                          prev.map((i, iIdx) => (iIdx === idx ? { ...i, categoria_id: val } : i))
                        );
                      }}
                      className="w-full h-9 px-2 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Validade do Lote */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-foreground/60 mb-1">Validade do Lote</label>
                    <input
                      type="date"
                      value={item.data_validade}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItensEntrada((prev) =>
                          prev.map((i, iIdx) => (iIdx === idx ? { ...i, data_validade: val } : i))
                        );
                      }}
                      className="w-full h-9 px-2 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  {/* Quantidade (editável) */}
                  <div className="md:col-span-1">
                    <label className="block text-[11px] text-foreground/60 mb-1">Qtd</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1;
                        setItensEntrada((prev) =>
                          prev.map((i, iIdx) => (iIdx === idx ? { ...i, quantidade: val } : i))
                        );
                      }}
                      className="w-full h-9 px-2 text-center rounded-xl bg-card border border-[var(--card-border)] text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  {/* Remover */}
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      onClick={() =>
                        setItensEntrada((prev) => prev.filter((_, iIdx) => iIdx !== idx))
                      }
                      className="p-2 rounded-xl text-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Remover produto da lista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rodapé Comum: Responsável e Confirmação */}
          <div className="pt-4 border-t border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-sm">
              <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-brand-500" />
                Responsável pela Ação <span className="text-rose-500">*</span>
              </label>
              {funcionarios.length > 0 ? (
                <select
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Selecione o funcionário responsável...</option>
                  {funcionarios.map((f) => (
                    <option key={f.id} value={f.nome}>
                      {f.nome}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  placeholder="Nome de quem está recebendo..."
                  className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              )}
            </div>

            <button
              onClick={handleConfirmarEntrada}
              disabled={loading || itensEntrada.length === 0}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/25"
            >
              {loading ? (
                <span>Gravando entrada...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar Entrada ({itensEntrada.reduce((a, b) => a + b.quantidade, 0)} itens)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ABA SAÍDA: LISTA ENXUTA (SEM ESTOQUE ANTES) */}
      {/* ========================================== */}
      {tab === 'saida' && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Lista de Itens para Saída ({itensSaida.length})
              </h4>
              <p className="text-xs text-foreground/60">
                Apenas nome e quantidade são exibidos nesta etapa. O estoque é atualizado e exibido ao confirmar (FEFO).
              </p>
            </div>
            {itensSaida.length > 0 && (
              <button
                onClick={() => setItensSaida([])}
                className="text-xs text-foreground/60 hover:text-rose-500 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar lista
              </button>
            )}
          </div>

          {itensSaida.length === 0 ? (
            <div className="py-12 text-center text-xs text-foreground/50 flex flex-col items-center gap-2">
              <Barcode className="w-10 h-10 stroke-1 text-foreground/30 animate-pulse" />
              Nenhum item bipado para saída. Bipe os produtos para registrar a baixa.
            </div>
          ) : (
            <div className="space-y-3">
              {itensSaida.map((item, idx) => (
                <div
                  key={item.tempId}
                  className="p-4 rounded-2xl bg-white/5 border border-[var(--card-border)]/60 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{item.nome}</p>
                      <p className="text-[11px] text-foreground/50 font-mono">{item.codigo_barras}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Quantidade editável */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-foreground/60 font-medium">Qtd:</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 1;
                          setItensSaida((prev) =>
                            prev.map((i, iIdx) => (iIdx === idx ? { ...i, quantidade: val } : i))
                          );
                        }}
                        className="w-16 h-9 px-2 text-center rounded-xl bg-card border border-[var(--card-border)] text-sm font-extrabold text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    <button
                      onClick={() =>
                        setItensSaida((prev) => prev.filter((_, iIdx) => iIdx !== idx))
                      }
                      className="p-2 rounded-xl text-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Remover produto da saída"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rodapé Comum: Responsável e Confirmação de Saída */}
          <div className="pt-4 border-t border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-sm">
              <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-brand-500" />
                Responsável pela Ação <span className="text-rose-500">*</span>
              </label>
              {funcionarios.length > 0 ? (
                <select
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Selecione o funcionário responsável...</option>
                  {funcionarios.map((f) => (
                    <option key={f.id} value={f.nome}>
                      {f.nome}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  placeholder="Nome de quem está autorizando a saída..."
                  className="w-full h-10 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              )}
            </div>

            <button
              onClick={handleConfirmarSaida}
              disabled={loading || itensSaida.length === 0}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 disabled:opacity-40 disabled:hover:bg-rose-500 transition-all shadow-lg shadow-rose-500/25"
            >
              {loading ? (
                <span>Processando baixa FEFO...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar Saída ({itensSaida.reduce((a, b) => a + b.quantidade, 0)} itens)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL DE RESULTADO FINAL DA SAÍDA          */}
      {/* ========================================== */}
      {resultadoSaidaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 border border-[var(--card-border)] shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Saída Processada com Sucesso!
                  </h3>
                  <p className="text-xs text-foreground/60">
                    Responsável: <span className="font-semibold text-foreground">{resultadoSaidaModal.responsavel}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Resultado Final de Cada Item (Estoque Anterior vs Estoque Atual) */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground/75 uppercase tracking-wider">
                Auditoria de Estoque por Item:
              </p>
              <div className="divide-y divide-[var(--card-border)]/50 rounded-2xl border border-[var(--card-border)] overflow-hidden">
                {resultadoSaidaModal.itens.map((res, i) => (
                  <div
                    key={i}
                    className="p-3.5 bg-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-foreground text-sm">{res.produto_nome}</p>
                      <p className="text-[11px] text-foreground/50 font-mono">
                        {res.codigo_barras} • Saída: {res.quantidade_saida} un.
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[10px] text-foreground/50 block">Estoque Anterior</span>
                        <span className="font-mono font-medium text-foreground/80">
                          {res.estoque_anterior} un.
                        </span>
                      </div>
                      <div className="text-foreground/40 font-mono">→</div>
                      <div>
                        <span className="text-[10px] text-emerald-400 font-semibold block">Estoque Atual</span>
                        <span className="font-mono font-extrabold text-emerald-400 text-sm">
                          {res.estoque_atual} un.
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setResultadoSaidaModal(null)}
                className="px-6 py-2.5 rounded-xl bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 transition-all shadow-md"
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
