'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye, EyeOff, Loader2, Wrench, User, ArrowRight, KeyRound,
  Brain, BarChart3, MessageSquare, Sparkles,
} from 'lucide-react';
import { useLogin } from '@/hooks/use-auth';
import { portalApi } from '@/lib/portal-api-client';
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
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone');
  const [pendingCustomerId, setPendingCustomerId] = useState('');
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState('');
  const { setAuth } = usePortalAuthStore();

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setClientLoading(true);
    setClientError('');
    try {
      const res = await portalApi.post<{ customerId: string }>('/auth/otp/request', { phone: phone.trim() });
      setPendingCustomerId(res.customerId);
      setOtpStep('code');
    } catch (err) {
      setClientError(err instanceof Error ? err.message : 'No se pudo enviar el código');
    } finally {
      setClientLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setClientLoading(true);
    setClientError('');
    try {
      const res = await portalApi.post<{ token: string; customer: PortalCustomer }>('/auth/otp/verify', {
        customerId: pendingCustomerId,
        code: otpCode.trim(),
      });
      setAuth(res.customer, res.token);
      const from = searchParams.get('from') ?? '/portal';
      router.replace(from.startsWith('/portal') ? from : '/portal');
    } catch (err) {
      setClientError(err instanceof Error ? err.message : 'Código incorrecto');
    } finally {
      setClientLoading(false);
    }
  }

  const sharedProps = {
    tab, setTab, login,
    phone, setPhone,
    otpCode,
    otpStep, setOtpStep,
    clientLoading, clientError,
    handleRequestOtp, handleVerifyOtp,
    setOtpCode: (v: string) => { setOtpCode(v); setClientError(''); },
  };

  return (
    <div className="auth-shell relative min-h-[100dvh] overflow-hidden font-[family-name:var(--font-inter)]">
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
                { icon: Brain, label: 'Diagnóstico IA' },
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
  otpCode: string;
  otpStep: 'phone' | 'code';
  setOtpStep: (s: 'phone' | 'code') => void;
  clientLoading: boolean;
  clientError: string;
  handleRequestOtp: (e: React.FormEvent) => void;
  handleVerifyOtp: (e: React.FormEvent) => void;
  setOtpCode: (v: string) => void;
}

function LoginCard({
  tab, setTab, login,
  phone, setPhone,
  otpCode, otpStep, setOtpStep,
  clientLoading, clientError,
  handleRequestOtp, handleVerifyOtp,
  setOtpCode,
}: LoginCardProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

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
        <p className="mt-1 text-sm text-zinc-500">
          {tab === 'taller' ? 'Ingresa con tu cuenta del taller' : 'Te enviamos un código por WhatsApp'}
        </p>
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
            {['Diagnóstico IA', 'Analítica', 'WhatsApp', 'Portal cliente'].map((f) => (
              <span key={f} className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-0.5 text-[10px] text-zinc-500">
                <Sparkles className="h-2.5 w-2.5 text-emerald-500/70" />
                {f}
              </span>
            ))}
          </div>
        </form>
      )}

      {tab === 'cliente' && otpStep === 'phone' && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div className="auth-field">
            <label htmlFor="phone" className="auth-label">Número de celular</label>
            <input
              id="phone"
              type="tel"
              placeholder="3001234567"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="auth-input"
              inputMode="numeric"
            />
            <p className="text-xs text-zinc-500">Te enviamos un código de 6 dígitos por WhatsApp</p>
          </div>

          {clientError && (
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {clientError}
            </div>
          )}

          <button type="submit" disabled={clientLoading || !phone.trim()} className="auth-submit">
            {clientLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Enviar código por WhatsApp</span>
                <ArrowRight className="h-[18px] w-[18px]" />
              </>
            )}
          </button>

          <p className="text-center text-sm text-zinc-500">
            ¿No tienes acceso?{' '}
            <span className="text-zinc-400">Solicítalo en el taller.</span>
          </p>
        </form>
      )}

      {tab === 'cliente' && otpStep === 'code' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
            Código enviado al <span className="font-semibold">{phone}</span>. Válido 5 min.
          </div>

          <div className="auth-field">
            <label htmlFor="otp-code" className="auth-label">Código de 6 dígitos</label>
            <input
              id="otp-code"
              type="text"
              placeholder="123456"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="auth-input text-center text-2xl tracking-[0.5em] font-mono"
              autoFocus
            />
          </div>

          {clientError && (
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {clientError}
            </div>
          )}

          <button type="submit" disabled={clientLoading || otpCode.length !== 6} className="auth-submit">
            {clientLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Verificar y entrar</span>
                <ArrowRight className="h-[18px] w-[18px]" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setOtpStep('phone'); setOtpCode(''); }}
            className="w-full text-center text-sm text-zinc-500 hover:text-zinc-400"
          >
            ← Cambiar número
          </button>
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
