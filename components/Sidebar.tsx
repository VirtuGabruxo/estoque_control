'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Package,
  Users,
  FileBarChart2,
  History,
  Settings,
  Store,
  ChevronRight,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'movimentacao'
  | 'produtos'
  | 'clientes'
  | 'relatorios'
  | 'historico'
  | 'configuracoes';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  moduloClientesAtivo: boolean;
}

export function Sidebar({ activeTab, setActiveTab, moduloClientesAtivo }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'movimentacao' as ActiveTab, label: 'Movimentação de Estoque', icon: ArrowLeftRight },
    { id: 'produtos' as ActiveTab, label: 'Produtos', icon: Package },
    ...(moduloClientesAtivo
      ? [{ id: 'clientes' as ActiveTab, label: 'Clientes (Fiado)', icon: Users }]
      : []),
    { id: 'relatorios' as ActiveTab, label: 'Relatórios', icon: FileBarChart2 },
    { id: 'historico' as ActiveTab, label: 'Histórico', icon: History },
    { id: 'configuracoes' as ActiveTab, label: 'Configurações', icon: Settings },
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col justify-between transition-all duration-300 ease-in-out
        glass-panel border-r shadow-xl
        ${isHovered ? 'w-64' : 'w-16 sm:w-20'}
      `}
    >
      {/* Brand Header */}
      <div>
        <div className="flex items-center h-16 px-4 border-b border-[var(--card-border)] overflow-hidden">
          <div className="flex items-center justify-center min-w-[32px] sm:min-w-[40px] h-10 rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
            <Store className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div
            className={`ml-3 transition-opacity duration-300 whitespace-nowrap overflow-hidden ${
              isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <h1 className="font-bold text-sm tracking-wide text-foreground flex items-center gap-1.5">
              Mercadinho <span className="text-xs px-1.5 py-0.5 rounded bg-brand-500 text-white font-medium">PRO</span>
            </h1>
            <p className="text-[11px] text-muted-foreground opacity-70">Controle de Estoque</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1.5 mt-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!isHovered ? item.label : undefined}
                className={`w-full flex items-center h-11 px-3 rounded-xl transition-all duration-200 group relative
                  ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25 font-medium'
                      : 'text-foreground/75 hover:bg-brand-500/10 hover:text-brand-500'
                  }
                `}
              >
                <div className="flex items-center justify-center min-w-[32px] sm:min-w-[40px]">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    }`}
                  />
                </div>
                <span
                  className={`ml-2 text-sm whitespace-nowrap transition-all duration-300 overflow-hidden ${
                    isHovered ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'
                  }`}
                >
                  {item.label}
                </span>

                {isActive && isHovered && (
                  <ChevronRight className="w-4 h-4 ml-auto opacity-75" />
                )}

                {/* Subtle active pill for collapsed state */}
                {isActive && !isHovered && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[var(--card-border)] overflow-hidden">
        <div
          className={`flex items-center transition-opacity duration-300 whitespace-nowrap ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
          <span className="text-[11px] text-foreground/60">Sistema Operacional</span>
        </div>
      </div>
    </aside>
  );
}
