'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, Wrench, Brain } from 'lucide-react';
import { portalApi } from '@/lib/portal-api-client';
import { usePortalAuthStore, type PortalCustomer } from '@/stores/portal-auth-store';

export default function PortalLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = usePortalAuthStore();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const res = await portalApi.post<{ token: string; customer: PortalCustomer }>('/login', {
        phone: phone.trim(),
        password,
      });
      setAuth(res.customer, res.token);
      const from = searchParams.get('from') ?? '/portal';
      router.replace(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
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
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Iniciar sesión</h2>
            <p className="text-sm text-text-tertiary mt-0.5">
              Accede para ver el estado de tu moto y tu historial de servicios.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">
                Número de teléfono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="3001234567"
                autoComplete="tel"
                className="w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !phone.trim() || !password}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-bg-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
              {loading ? 'Ingresando…' : 'Entrar al portal'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-text-tertiary">
          ¿No tienes acceso? Solicítalo en el taller.
        </p>
      </div>
    </div>
  );
}
