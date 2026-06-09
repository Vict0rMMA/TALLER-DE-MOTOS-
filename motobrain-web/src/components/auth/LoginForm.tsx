'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye, EyeOff, Loader2, Wrench, User, ArrowRight, KeyRound,
  Brain, BarChart3, MessageSquare, Sparkles,
} from 'lucide-react';
import { useLogin } from '@/hooks/use-auth';
import { portalApi } from '@/lib/portal-api-client';
import { getApiMisconfigMessage, isApiMisconfigured } from '@/lib/api-base';
import { buildPortalLoginPayload, formatPortalLoginError } from '@/lib/portal-login';
import { usePortalAuthStore, type PortalCustomer } from '@/stores/portal-auth-store';
import { AuthMarketingPanel } from '@/components/auth/AuthMarketingPanel';
import { cn } from '@/lib/utils';

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'cliente' ? 'cliente' : 'taller';
  const [tab, setTab] = useState<'taller' | 'cliente'>(initialTab);

  const login = useLogin();

  const [phone, setPhone] = useState('');
  const [clientCedula, setClientCedula] = useState('');
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState('');
  const { setAuth } = usePortalAuthStore();

  async function handleClientLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || !clientCedula) return;
    if (isApiMisconfigured()) {
      setClientError(getApiMisconfigMessage());
      return;
    }
    setClientLoading(true);
    setClientError('');
    try {
      const res = await portalApi.post<{ token: string; customer: PortalCustomer }>(
        '/login',
        buildPortalLoginPayload(phone, clientCedula),
      );
      setAuth(res.customer, res.token);
      const from = searchParams.get('from') ?? '/portal';
      router.replace(from.startsWith('/portal') ? from : '/portal');
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Celular o cédula incorrectos';
      setClientError(formatPortalLoginError(raw));
    } finally {
      setClientLoading(false);
    }
  }

  const sharedProps = {
    tab, setTab, login,
    phone, setPhone,
    clientCedula, setClientCedula,
    clientLoading, clientError, setClientError,
    handleClientLogin,
  };

  return (
    <div className="auth-shell relative min-h-[100dvh] overflow-hidden font-sans">
      <div className="auth-bg-layer" aria-hidden />
      <div className="auth-bg-vignette" aria-hidden />

      <div className="relative z-[1] hidden min-h-[100dvh] lg:flex lg:flex-row">
        <aside className="auth-marketing-wrap lg:flex lg:w-[min(42%,440px)] lg:shrink-0 xl:w-[400px]">
          <AuthMarketingPanel />
        </aside>
        <main className="flex flex-1 flex-col items-center justify-center px-12 xl:px-16">
          <div className="w-full max-w-[420px]">
            <div className="auth-glass-card">
              <LoginCard {...sharedProps} />
            </div>
          </div>
        </main>
      </div>

      <div className="relative z-[1] flex min-h-[100dvh] flex-col lg:hidden">
        <div className="relative flex shrink-0 flex-col items-center justify-end pb-8 pt-14" style={{ minHeight: '38vh' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 shadow-lg shadow-emerald-500/20">
              <Wrench className="h-5 w-5 text-emerald-400" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-white">
                MotoBrain <span className="text-emerald-400">AI</span>
              </p>
              <p className="text-[11px] text-zinc-400">Gestión inteligente de talleres</p>
            </div>
          </div>

          {tab === 'taller' && (
            <div className="mt-6 flex gap-4">
              {[
                { icon: Brain, label: 'Diagnóstico' },
                { icon: BarChart3, label: 'Analítica' },
                { icon: MessageSquare, label: 'Consultas' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                    <Icon className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
                  </div>
                  <span className="text-[10px] text-zinc-500">{label}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'cliente' && (
            <p className="mt-4 text-sm text-zinc-400">Consulta el estado de tu moto</p>
          )}
        </div>

        <div className="relative flex-1 rounded-t-[2rem] border-t border-zinc-800/60 bg-zinc-950 px-6 pb-safe pt-8 shadow-2xl">
          <div className="mx-auto w-full max-w-sm">
            <LoginCard {...sharedProps} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoginCardProps {
  tab: 'taller' | 'cliente';
  setTab: (t: 'taller' | 'cliente') => void;
  login: ReturnType<typeof useLogin>;
  phone: string;
  setPhone: (v: string) => void;
  clientCedula: string;
  setClientCedula: (v: string) => void;
  clientLoading: boolean;
  clientError: string;
  setClientError: (v: string) => void;
  handleClientLogin: (e: React.FormEvent) => void;
}

function LoginCard({
  tab, setTab, login,
  phone, setPhone,
  clientCedula, setClientCedula,
  clientLoading, clientError, setClientError,
  handleClientLogin,
}: LoginCardProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [serverStatus, setServerStatus] = useState<'checking' | 'ok' | 'down'>('checking');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      setServerStatus('ok');
      return;
    }
    fetch('/api/backend/health', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) {
          setServerStatus('down');
          return;
        }
        const d = (await r.json()) as { ok?: boolean };
        setServerStatus(d.ok ? 'ok' : 'down');
      })
      .catch(() => setServerStatus('down'));
  }, []);

  function handleTallerSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: { email?: string; password?: string } = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Email inválido';
    }
    if (!password) {
      errs.password = 'La contraseña es requerida';
    }
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    login.mutate({ email: email.trim(), password });
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-[1.35rem] font-bold tracking-tight text-white">
          {tab === 'taller' ? 'Iniciar sesión' : 'Accede a tu portal'}
        </h2>
        {tab === 'taller' && (
          <p className="mt-1 text-sm text-zinc-500">Ingresa con tu cuenta del taller</p>
        )}
      </div>

      <div className="auth-tabs mb-6" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'taller'}
          onClick={() => setTab('taller')}
          className={cn('auth-tab', tab === 'taller' && 'auth-tab-active')}
        >
          <KeyRound className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Soy del taller
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'cliente'}
          onClick={() => setTab('cliente')}
          className={cn('auth-tab', tab === 'cliente' && 'auth-tab-active')}
        >
          <User className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Soy cliente
        </button>
      </div>

      {tab === 'taller' && serverStatus === 'down' && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          El servidor no responde. Intenta de nuevo en unos segundos o contacta al administrador.
        </div>
      )}

      {tab === 'taller' && (
        <form onSubmit={handleTallerSubmit} className="space-y-4">
          <div className="auth-field">
            <label htmlFor="email" className="auth-label">Email</label>
            <input
              id="email"
              type="email"
              placeholder="admin@taller.com"
              autoComplete="username"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
              className="auth-input"
            />
            {fieldErrors.email && <p className="auth-error">{fieldErrors.email}</p>}
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">Contraseña</label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
                className="auth-input pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="auth-input-toggle"
                aria-label={showPw ? 'Ocultar' : 'Mostrar'}
              >
                {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
            {fieldErrors.password && <p className="auth-error">{fieldErrors.password}</p>}
          </div>

          {login.isError && (
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {(login.error as Error)?.message ?? 'Credenciales inválidas'}
            </div>
          )}

          <button type="submit" disabled={login.isPending} className="auth-submit mt-2">
            {login.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Iniciar sesión</span>
                <ArrowRight className="h-[18px] w-[18px]" />
              </>
            )}
          </button>

          <p className="pt-1 text-center text-sm text-zinc-500">
            ¿Sin cuenta?{' '}
            <Link href="/register" className="font-medium text-emerald-400 hover:text-emerald-300">
              Regístrate gratis
            </Link>
          </p>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {['Diagnóstico', 'Analítica', 'WhatsApp', 'Portal cliente'].map((f) => (
              <span key={f} className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-0.5 text-[10px] text-zinc-500">
                <Sparkles className="h-2.5 w-2.5 text-emerald-500/70" />
                {f}
              </span>
            ))}
          </div>
        </form>
      )}

      {tab === 'cliente' && (
        <form onSubmit={handleClientLogin} className="space-y-4">
          <div className="auth-field">
            <label htmlFor="client-phone" className="auth-label">Celular</label>
            <input
              id="client-phone"
              type="tel"
              placeholder="3001234567"
              autoComplete="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setClientError(''); }}
              className="auth-input"
              inputMode="numeric"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="client-cedula" className="auth-label">Cédula</label>
            <div className="relative">
              <input
                id="client-cedula"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="off"
                value={clientCedula}
                onChange={(e) => { setClientCedula(e.target.value); setClientError(''); }}
                className="auth-input pr-12"
                inputMode="numeric"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="auth-input-toggle"
                aria-label={showPw ? 'Ocultar' : 'Mostrar'}
              >
                {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>

          {clientError && (
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {clientError}
            </div>
          )}

          <button type="submit" disabled={clientLoading || !phone.trim() || !clientCedula} className="auth-submit">
            {clientLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Entrar al portal</span>
                <ArrowRight className="h-[18px] w-[18px]" />
              </>
            )}
          </button>

          <p className="text-center text-sm text-text-tertiary pt-1">
            ¿Cliente nuevo?{' '}
            <a href="/portal-registro" className="text-accent hover:underline font-medium">
              Regístrate aquí
            </a>
          </p>

        </form>
      )}
    </>
  );
}

export function LoginForm() {
  return (
    <Suspense>
      <LoginFormInner />
    </Suspense>
  );
}
