'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, Brain, UserPlus, LogIn } from 'lucide-react';
import { portalApi } from '@/lib/portal-api-client';
import { buildPortalLoginPayload, formatPortalLoginError } from '@/lib/portal-login';
import { usePortalAuthStore, type PortalCustomer } from '@/stores/portal-auth-store';

type Tab = 'login' | 'register';

export default function PortalLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = usePortalAuthStore();

  const [tab, setTab] = useState<Tab>('login');

  // Login
  const [phone, setPhone] = useState('');
  const [cedula, setCedula] = useState('');
  const [showCedula, setShowCedula] = useState(false);

  // Register
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCedula, setRegCedula] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [showRegCedula, setShowRegCedula] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function goPortal(customer: PortalCustomer, token: string) {
    setAuth(customer, token);
    const from = searchParams.get('from') ?? '/portal';
    router.replace(from);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || !cedula.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await portalApi.post<{ token: string; customer: PortalCustomer }>(
        '/login',
        buildPortalLoginPayload(phone, cedula),
      );
      goPortal(res.customer, res.token);
    } catch (err) {
      setError(formatPortalLoginError(err instanceof Error ? err.message : 'Error al iniciar sesión'));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim() || !regCedula.trim()) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await portalApi.post<{ token: string; customer: PortalCustomer }>('/register', {
        name: regName.trim(),
        phone: regPhone.trim(),
        cedula: regCedula.trim(),
        email: regEmail.trim() || undefined,
      });
      goPortal(res.customer, res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-bg-primary pattern-grid flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-accent/10 border border-accent/20">
            <Brain className="h-7 w-7 text-accent" strokeWidth={1.75} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">MotoBrain</h1>
            <p className="text-sm text-text-tertiary mt-0.5">Portal del cliente</p>
          </div>
        </div>

        <div className="glass-card p-7 space-y-5">
          {/* Tabs */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => { setTab('login'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${tab === 'login' ? 'bg-accent text-bg-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <LogIn className="h-3.5 w-3.5" /> Iniciar sesión
            </button>
            <button
              onClick={() => { setTab('register'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${tab === 'register' ? 'bg-accent text-bg-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <UserPlus className="h-3.5 w-3.5" /> Registrarme
            </button>
          </div>

          {/* Login */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-text-secondary">Número de teléfono</label>
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="3001234567" autoComplete="tel"
                  className="w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-text-secondary">Cédula</label>
                <div className="relative">
                  <input
                    type={showCedula ? 'text' : 'password'} value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="Tu número de cédula" autoComplete="off" inputMode="numeric"
                    className="w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                  />
                  <button type="button" onClick={() => setShowCedula(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                    {showCedula ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <div className="rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">{error}</div>}
              <button type="submit" disabled={loading || !phone.trim() || !cedula.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-bg-primary hover:opacity-90 disabled:opacity-50 transition-opacity">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {loading ? 'Ingresando...' : 'Entrar al portal'}
              </button>
            </form>
          )}

          {/* Register */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <p className="text-xs text-text-tertiary">Regístrate para ver el estado de tu moto y solicitar citas.</p>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-text-secondary">Nombre completo *</label>
                <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)}
                  placeholder="Tu nombre completo" autoComplete="name"
                  className="w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-text-secondary">Teléfono *</label>
                <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="3001234567" autoComplete="tel" inputMode="numeric"
                  className="w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-text-secondary">Cédula *</label>
                <div className="relative">
                  <input type={showRegCedula ? 'text' : 'password'} value={regCedula}
                    onChange={(e) => setRegCedula(e.target.value)}
                    placeholder="Número de cédula" autoComplete="off" inputMode="numeric"
                    className="w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors" />
                  <button type="button" onClick={() => setShowRegCedula(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                    {showRegCedula ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-text-secondary">Email (opcional)</label>
                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="tu@correo.com" autoComplete="email"
                  className="w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors" />
              </div>
              {error && <div className="rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">{error}</div>}
              {success && <div className="rounded-lg border border-success/30 bg-success/5 px-3.5 py-2.5 text-sm text-success">{success}</div>}
              <button type="submit" disabled={loading || !regName.trim() || !regPhone.trim() || !regCedula.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-bg-primary hover:opacity-90 disabled:opacity-50 transition-opacity">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {loading ? 'Registrando...' : 'Crear mi cuenta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
