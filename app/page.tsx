'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, ActiveTab } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DashboardView } from '@/components/DashboardView';
import { MovimentacaoView } from '@/components/MovimentacaoView';
import { ProdutosView } from '@/components/ProdutosView';
import { ClientesView } from '@/components/ClientesView';
import { RelatoriosView } from '@/components/RelatoriosView';
import { HistoricoView } from '@/components/HistoricoView';
import { ConfiguracoesView } from '@/components/ConfiguracoesView';
import { User } from '@/lib/types';
import { RefreshCw } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [moduloClientesAtivo, setModuloClientesAtivo] = useState(true);

  // Check authentication
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!data.user) {
        router.push('/login');
        return;
      }
      setCurrentUser(data.user);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoadingUser(false);
    }
  };

  // Check modulo clientes status
  const checkConfig = async () => {
    try {
      const res = await fetch('/api/configuracoes');
      if (res.ok) {
        const data = await res.json();
        setModuloClientesAtivo(data.modulo_clientes);
      }
    } catch (e) {}
  };

  useEffect(() => {
    checkAuth();
    checkConfig();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      router.push('/login');
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-sm font-medium text-foreground/60">Carregando sistema de estoque...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Menu Lateral Suspenso (Esquerda) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        moduloClientesAtivo={moduloClientesAtivo}
      />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col pl-16 sm:pl-20 transition-all duration-300 ease-in-out">
        {/* Cabeçalho Superior com Notificações e Usuário */}
        <Header
          user={currentUser}
          activeTab={activeTab}
          onLogout={handleLogout}
        />

        {/* Corpo Dinâmico por Aba */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'movimentacao' && <MovimentacaoView />}
          {activeTab === 'produtos' && <ProdutosView />}
          {activeTab === 'clientes' && moduloClientesAtivo && <ClientesView />}
          {activeTab === 'relatorios' && <RelatoriosView />}
          {activeTab === 'historico' && <HistoricoView />}
          {activeTab === 'configuracoes' && (
            <ConfiguracoesView
              currentUser={currentUser}
              onConfigChanged={checkConfig}
            />
          )}
        </main>
      </div>
    </div>
  );
}
