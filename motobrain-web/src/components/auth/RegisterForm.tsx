'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Building2, KeyRound, ArrowLeft } from 'lucide-react';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { useRegister } from '@/hooks/use-auth';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Mode = 'choose' | 'new-workshop' | 'join-code';

const ROLE_OPTIONS = [
  { value: 'mechanic', label: 'Mecánico' },
  { value: 'seller', label: 'Vendedor' },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-text-secondary">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";

export function RegisterForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const registerMutation = useRegister();

  const [mode, setMode] = useState<Mode>('choose');
  const [showPw, setShowPw] = useState(false);

  // Nuevo taller - step
  const [step, setStep] = useState(1);
  const [ntName, setNtName] = useState('');
  const [ntEmail, setNtEmail] = useState('');
  const [ntPw, setNtPw] = useState('');
  const [ntPw2, setNtPw2] = useState('');
  const [wsName, setWsName] = useState('');
  const [wsPhone, setWsPhone] = useState('');
  const [ntError, setNtError] = useState('');

  // Unirse con código
  const [code, setCode] = useState('');
  const [jName, setJName] = useState('');
  const [jEmail, setJEmail] = useState('');
  const [jPw, setJPw] = useState('');
  const [jRole, setJRole] = useState('mechanic');
  const [jLoading, setJLoading] = useState(false);
  const [jError, setJError] = useState('');

  async function handleNewWorkshop(e: React.FormEvent) {
    e.preventDefault();
    if (ntPw !== ntPw2) { setNtError('Las contraseñas no coinciden'); return; }
    setNtError('');
    registerMutation.mutate({ name: ntName, email: ntEmail, password: ntPw, confirmPassword: ntPw2, workshopName: wsName, workshopPhone: wsPhone });
  }

  async function handleJoinCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !jName.trim() || !jEmail.trim() || !jPw.trim()) return;
    setJLoading(true); setJError('');
    try {
      const res = await api.post<{ token: string; user: any; workshopName: string }>(
        '/auth/register-with-code',
        { inviteCode: code.trim().toUpperCase(), name: jName.trim(), email: jEmail.trim(), password: jPw, role: jRole }
      );
      setAuth(res.user, res.token);
      toast.success(`Bienvenido al taller ${res.workshopName}`);
      router.replace('/');
    } catch (err) {
      setJError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setJLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-bg-primary pattern-grid flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <BrandLogo className="justify-center" />
        </div>

        <div className="glass-card p-7 space-y-6">

          {/* ELEGIR MODO */}
          {mode === 'choose' && (
            <>
              <div className="text-center space-y-1">
                <h1 className="text-xl font-bold text-text-primary">Crear cuenta</h1>
                <p className="text-sm text-text-tertiary">¿Cómo quieres registrarte?</p>
              </div>
              <div className="grid gap-3">
                <button
                  onClick={() => setMode('new-workshop')}
                  className="flex items-start gap-4 rounded-xl border border-border bg-bg-elevated p-4 text-left hover:border-accent transition-colors group"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20">
                    <Building2 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">Soy dueño de un taller</p>
                    <p className="text-xs text-text-tertiary mt-0.5">Crea tu taller y gestiona todo desde cero</p>
                  </div>
                </button>

                <button
                  onClick={() => setMode('join-code')}
                  className="flex items-start gap-4 rounded-xl border border-border bg-bg-elevated p-4 text-left hover:border-accent transition-colors group"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20">
                    <KeyRound className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm">Soy mecánico / vendedor</p>
                    <p className="text-xs text-text-tertiary mt-0.5">Ingresa el código que te dio el administrador del taller</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* NUEVO TALLER */}
          {mode === 'new-workshop' && (
            <>
              <div className="flex items-center gap-2">
                <button onClick={() => { setMode('choose'); setStep(1); }} className="text-text-tertiary hover:text-text-primary">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h1 className="text-lg font-bold text-text-primary">Nuevo taller</h1>
                  <p className="text-xs text-text-tertiary">Paso {step} de 2</p>
                </div>
              </div>

              <form onSubmit={step === 1 ? (e) => { e.preventDefault(); if (ntPw !== ntPw2) { setNtError('Las contraseñas no coinciden'); return; } setNtError(''); setStep(2); } : handleNewWorkshop} className="space-y-4">
                {step === 1 ? (
                  <>
                    <Field label="Nombre completo">
                      <input className={inputCls} value={ntName} onChange={e => setNtName(e.target.value)} placeholder="Tu nombre" required />
                    </Field>
                    <Field label="Email">
                      <input className={inputCls} type="email" value={ntEmail} onChange={e => setNtEmail(e.target.value)} placeholder="admin@taller.com" required />
                    </Field>
                    <Field label="Contraseña">
                      <div className="relative">
                        <input className={inputCls + ' pr-10'} type={showPw ? 'text' : 'password'} value={ntPw} onChange={e => setNtPw(e.target.value)} placeholder="Mínimo 6 caracteres" required />
                        <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </Field>
                    <Field label="Confirmar contraseña">
                      <input className={inputCls} type="password" value={ntPw2} onChange={e => setNtPw2(e.target.value)} placeholder="Repite la contraseña" required />
                    </Field>
                    {ntError && <p className="text-xs text-danger">{ntError}</p>}
                    <button type="submit" className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-bg-primary hover:opacity-90 transition-opacity">
                      Siguiente →
                    </button>
                  </>
                ) : (
                  <>
                    <Field label="Nombre del taller">
                      <input className={inputCls} value={wsName} onChange={e => setWsName(e.target.value)} placeholder="Mi Taller MotoBrain" required />
                    </Field>
                    <Field label="Teléfono del taller">
                      <input className={inputCls} type="tel" value={wsPhone} onChange={e => setWsPhone(e.target.value)} placeholder="3001234567" />
                    </Field>
                    {registerMutation.error && (
                      <p className="text-xs text-danger">{(registerMutation.error as Error).message}</p>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-lg border border-border py-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
                        ← Atrás
                      </button>
                      <button type="submit" disabled={registerMutation.isPending} className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-bg-primary hover:opacity-90 disabled:opacity-50 transition-opacity">
                        {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Crear taller'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </>
          )}

          {/* UNIRSE CON CÓDIGO */}
          {mode === 'join-code' && (
            <>
              <div className="flex items-center gap-2">
                <button onClick={() => setMode('choose')} className="text-text-tertiary hover:text-text-primary">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h1 className="text-lg font-bold text-text-primary">Unirme al taller</h1>
                  <p className="text-xs text-text-tertiary">Ingresa el código que te dio el administrador</p>
                </div>
              </div>

              <form onSubmit={handleJoinCode} className="space-y-4">
                <Field label="Código de invitación">
                  <input className={inputCls + ' uppercase tracking-widest font-mono text-center text-lg'} value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())} placeholder="XXXXXXXX" maxLength={8} required />
                </Field>
                <Field label="Tu nombre">
                  <input className={inputCls} value={jName} onChange={e => setJName(e.target.value)} placeholder="Nombre completo" required />
                </Field>
                <Field label="Email">
                  <input className={inputCls} type="email" value={jEmail} onChange={e => setJEmail(e.target.value)} placeholder="tu@email.com" required />
                </Field>
                <Field label="Contraseña">
                  <div className="relative">
                    <input className={inputCls + ' pr-10'} type={showPw ? 'text' : 'password'} value={jPw} onChange={e => setJPw(e.target.value)} placeholder="Mínimo 6 caracteres" required />
                    <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <Field label="Mi rol en el taller">
                  <div className="flex gap-2">
                    {ROLE_OPTIONS.map(r => (
                      <button key={r.value} type="button" onClick={() => setJRole(r.value)}
                        className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${jRole === r.value ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:border-accent'}`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </Field>
                {jError && <div className="rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">{jError}</div>}
                <button type="submit" disabled={jLoading || !code.trim() || !jName.trim() || !jEmail.trim() || !jPw.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-bg-primary hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {jLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  {jLoading ? 'Verificando código...' : 'Unirme al taller'}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-text-tertiary pt-1">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-accent hover:underline font-medium">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
