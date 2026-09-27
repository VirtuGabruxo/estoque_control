'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { User, Notificacao } from '@/lib/types';
import { ActiveTab } from './Sidebar';

interface HeaderProps {
  user: User | null;
  activeTab: ActiveTab;
  onLogout: () => void;
}

export function Header({ user, activeTab, onLogout }: HeaderProps) {
  const { mode, toggleMode } = useTheme();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const titles: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Geral',
      subtitle: 'Visão consolidada de estoque, alertas de validade e movimentações.',
    },
    movimentacao: {
      title: 'Movimentação de Estoque',
      subtitle: 'Entrada e saída de mercadorias com leitor de código de barras.',
    },
    produtos: {
      title: 'Catálogo de Produtos',
      subtitle: 'Organização por categorias, validades e códigos de barras.',
    },
    clientes: {
      title: 'Clientes e Vendas Fiadas',
      subtitle: 'Controle de dívidas, lançamentos de compras e histórico de quitação.',
    },
    relatorios: {
      title: 'Relatórios Gerenciais',
      subtitle: 'Análises detalhadas por período, categorias e risco de validade.',
    },
    historico: {
      title: 'Histórico de Operações',
      subtitle: 'Auditoria completa de entradas e saídas com assinatura de responsável.',
    },
    configuracoes: {
      title: 'Configurações do Sistema',
      subtitle: 'Personalização visual, gestão de funcionários e parâmetros operacionais.',
    },
  };

  // Fetch notifications
  const loadNotificacoes = async () => {
    try {
      const res = await fetch('/api/notificacoes');
      if (res.ok) {
        const data = await res.json();
        setNotificacoes(data.notificacoes || []);
        setTotalNaoLidas(data.totalNaoLidas || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadNotificacoes();
    const interval = setInterval(loadNotificacoes, 45000); // Check every 45s
    return () => clearInterval(interval);
  }, []);

  // Close popovers when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarcarTodasLidas = async () => {
    try {
      await fetch('/api/notificacoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marcar_todas: true }),
      });
      setTotalNaoLidas(0);
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarcarUmaLida = async (id: string) => {
    try {
      await fetch('/api/notificacoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
      );
      setTotalNaoLidas((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const currentInfo = titles[activeTab] || titles.dashboard;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 glass-panel border-b border-[var(--card-border)]">
      {/* Title section */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
          {currentInfo.title}
        </h2>
        <p className="hidden md:block text-xs text-foreground/60">
          {currentInfo.subtitle}
        </p>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleMode}
          title={mode === 'escuro' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          className="p-2 rounded-xl text-foreground/80 hover:bg-brand-500/10 hover:text-brand-500 transition-colors"
        >
          {mode === 'escuro' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-500" />
          )}
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl text-foreground/80 hover:bg-brand-500/10 hover:text-brand-500 transition-colors"
            title="Notificações de Validade"
          >
            <Bell className="w-5 h-5" />
            {totalNaoLidas > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-pulse shadow-sm">
                {totalNaoLidas > 99 ? '99+' : totalNaoLidas}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel border border-[var(--card-border)] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-500" />
                  <span className="font-semibold text-sm text-foreground">Alertas do Sistema</span>
                  {totalNaoLidas > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-medium">
                      {totalNaoLidas} novo(s)
                    </span>
                  )}
                </div>
                {totalNaoLidas > 0 && (
                  <button
                    onClick={handleMarcarTodasLidas}
                    className="text-xs text-brand-500 hover:underline flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Ler todas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto mt-2 divide-y divide-[var(--card-border)]/50">
                {notificacoes.length === 0 ? (
                  <div className="py-8 text-center text-foreground/50 text-xs">
                    Nenhum alerta de validade no momento.
                  </div>
                ) : (
                  notificacoes.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.lida && handleMarcarUmaLida(n.id)}
                      className={`py-2.5 px-2 rounded-xl transition-colors cursor-pointer flex items-start gap-3 ${
                        !n.lida
                          ? 'bg-brand-500/10 border-l-2 border-brand-500'
                          : 'opacity-65 hover:bg-white/5'
                      }`}
                    >
                      <div className="mt-0.5">
                        {n.titulo.includes('HOJE') ? (
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-foreground">{n.titulo}</p>
                        <p className="text-xs text-foreground/80 mt-0.5">{n.mensagem}</p>
                        <span className="text-[10px] text-foreground/50 mt-1 block">
                          {new Date(n.criado_em).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(n.criado_em).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge & Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-[var(--card-border)] hover:bg-brand-500/10 transition-all text-foreground"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold leading-tight">{user?.nome || 'Usuário'}</p>
              <p className="text-[10px] text-foreground/60 capitalize flex items-center gap-1">
                {user?.papel === 'administrador' ? (
                  <span className="text-brand-500 font-medium flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </span>
                ) : (
                  <span>Convidado</span>
                )}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-1" />
          </button>

          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel border border-[var(--card-border)] shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-[var(--card-border)]">
                <p className="text-xs font-semibold text-foreground">
                  {user?.nome} {user?.sobrenome}
                </p>
                <p className="text-[11px] text-foreground/60 truncate">{user?.email}</p>
                {user?.telefone && (
                  <p className="text-[11px] text-foreground/60">{user.telefone}</p>
                )}
                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-brand-500/15 text-brand-500 border border-brand-500/30">
                  {user?.papel === 'administrador' ? '🛡️ Administrador Geral' : '👤 Convidado / Operador'}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair do Sistema
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
