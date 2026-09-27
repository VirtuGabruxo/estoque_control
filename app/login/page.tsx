'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');

  // Register form state
  const [regNome, setRegNome] = useState('');
  const [regSobrenome, setRegSobrenome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regTelefone, setRegTelefone] = useState('');
  const [regSenha, setRegSenha] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, senha: loginSenha }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar login.');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: regNome.trim(),
          sobrenome: regSobrenome.trim(),
          email: regEmail.trim(),
          telefone: regTelefone.trim() || undefined,
          senha: regSenha,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar usuário.');
      }

      setSuccessMsg('Cadastro realizado com sucesso! Redirecionando para o painel...');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 border border-[var(--card-border)] shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 border border-brand-500/25 mb-1 shadow-inner">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center justify-center gap-2">
            Mercadinho <span className="text-xs px-2 py-0.5 rounded-md bg-brand-500 text-white font-medium">PRO</span>
          </h1>
          <p className="text-xs text-foreground/60">
            Controle de Estoque, Validades e Vendas Fiadas
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-card border border-[var(--card-border)]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'login'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            Entrar
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'register'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            Registrar-se
          </button>
        </div>

        {/* Notification / Error / Success Badges */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in duration-150">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                  type="password"
                  required
                  value={loginSenha}
                  onChange={(e) => setLoginSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 disabled:opacity-50 transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="text-xs text-brand-500 hover:underline"
              >
                Não possui conta? Registrar-se agora
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: REGISTER FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5 animate-in fade-in duration-150">
            <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-foreground/80 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-500 shrink-0" />
              <span>O 1º usuário registrado será o <strong>Administrador</strong>. Os seguintes serão <strong>Convidados</strong>.</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-foreground">
                  Nome <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                  <input
                    type="text"
                    required
                    value={regNome}
                    onChange={(e) => setRegNome(e.target.value)}
                    placeholder="João"
                    className="w-full h-9 pl-9 pr-2 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-foreground">
                  Sobrenome <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regSobrenome}
                  onChange={(e) => setRegSobrenome(e.target.value)}
                  placeholder="Silva"
                  className="w-full h-9 px-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-foreground">
                E-mail <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="joao@mercadinho.com"
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-foreground">
                Telefone (Opcional)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                  type="tel"
                  value={regTelefone}
                  onChange={(e) => setRegTelefone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-foreground">
                Criação de Senha <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regSenha}
                  onChange={(e) => setRegSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-card border border-[var(--card-border)] text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 disabled:opacity-50 transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>Criando conta...</span>
              ) : (
                <>
                  <span>Criar Conta e Acessar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="text-xs text-brand-500 hover:underline"
              >
                Já possui conta? Fazer login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
