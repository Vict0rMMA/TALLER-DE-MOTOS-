'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User, Phone, CreditCard, Mail, Hash, Gauge, Calendar,
  ChevronRight, ChevronLeft, Loader2, Check, Sparkles, Wrench,
  ArrowRight, Camera, X, Shield, Zap, Gift,
} from 'lucide-react';
import { portalApi, PortalApiError } from '@/lib/portal-api-client';
import { usePortalAuthStore, type PortalCustomer } from '@/stores/portal-auth-store';
import { cn } from '@/lib/utils';

const BRANDS = [
  'AKT', 'Bajaj', 'Honda', 'Yamaha', 'Suzuki',
  'TVS', 'Hero', 'KTM', 'Kawasaki', 'Royal Enfield',
  'Auteco', 'Kymco', 'Otro',
];

function OptionalBadge() {
  return (
    <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
      <Sparkles className="h-2.5 w-2.5" />
      Opcional
    </span>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-3">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                done && 'bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-lg shadow-emerald-500/25',
                active && 'bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-transparent',
                !done && !active && 'bg-zinc-800 text-zinc-500 border border-zinc-700',
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < total - 1 && (
              <div className={cn('h-px w-8 transition-colors duration-300', done ? 'bg-emerald-500/50' : 'bg-zinc-700')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface Step1Data {
  name: string;
  phone: string;
  cedula: string;
  email: string;
}

interface Step2Data {
  placa: string;
  brand: string;
  model: string;
  cc: string;
  year: string;
  photoPreview: string | null;
}

// ── Normalizadores ──────────────────────────────────────────────
function normalizePhone(raw: string): string {
  // Quita +57 / 57 al inicio, espacios, guiones, paréntesis
  let n = raw.replace(/[\s\-()+]/g, '');
  if (n.startsWith('57') && n.length > 10) n = n.slice(2);
  return n;
}

function normalizeCedula(raw: string): string {
  // Quita puntos, espacios, guiones (ej: 1.234.567 → 1234567)
  return raw.replace(/[\s.\-]/g, '');
}

function normalizeName(raw: string): string {
  // Colapsa espacios dobles, no permite solo números
  return raw.replace(/\s{2,}/g, ' ');
}
// ────────────────────────────────────────────────────────────────

function PortalRegisterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = usePortalAuthStore();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [s1, setS1] = useState<Step1Data>({ name: '', phone: '', cedula: '', email: '' });
  const [s1Errors, setS1Errors] = useState<Partial<Step1Data>>({});

  const [s2, setS2] = useState<Step2Data>({ placa: '', brand: '', model: '', cc: '', year: '', photoPreview: null });
  const [s2Errors, setS2Errors] = useState<Partial<Record<keyof Step2Data, string>>>({});

  function validateStep1(): boolean {
    const errs: Partial<Step1Data> = {};
    const name = s1.name.trim();
    if (!name) errs.name = 'El nombre es requerido';
    else if (/^\d+$/.test(name)) errs.name = 'Ingresa tu nombre real';

    const phone = normalizePhone(s1.phone);
    if (!phone) errs.phone = 'Ingresa tu número de celular';
    else if (phone.length < 7) errs.phone = 'Número muy corto';
    else if (phone.length > 12) errs.phone = 'Número muy largo';

    const cedula = normalizeCedula(s1.cedula);
    if (!cedula) errs.cedula = 'Ingresa tu número de cédula';
    else if (cedula.length < 4) errs.cedula = 'Cédula muy corta';

    if (!s1.email.trim()) errs.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s1.email.trim())) errs.email = 'Email inválido (ej: juan@gmail.com)';

    setS1Errors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: Partial<Record<keyof Step2Data, string>> = {};
    const placa = s2.placa.toUpperCase().replace(/[\s\-]/g, '');
    if (!placa) errs.placa = 'Ingresa la placa de la moto';
    else if (placa.length < 3) errs.placa = 'Placa inválida (ej: ABC123)';
    if (!s2.brand) errs.brand = 'Selecciona la marca';
    if (!s2.model.trim()) errs.model = 'El modelo es requerido';
    setS2Errors(errs);
    return Object.keys(errs).length === 0;
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setS2((p) => ({ ...p, photoPreview: ev.target?.result as string }));
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!validateStep2()) return;
    setLoading(true);
    setError('');
    try {
      const ccNum = s2.cc ? parseInt(s2.cc) : undefined;
      const yearNum = s2.year ? parseInt(s2.year) : undefined;
      const res = await portalApi.post<{ token: string; customer: PortalCustomer }>('/register', {
        name: s1.name.trim(),
        phone: normalizePhone(s1.phone),
        cedula: normalizeCedula(s1.cedula),
        email: s1.email.trim().toLowerCase(),
        moto: {
          placa: s2.placa.toUpperCase().replace(/[\s\-]/g, ''),
          brand: s2.brand,
          model: s2.model.trim(),
          cc: ccNum && ccNum > 0 ? ccNum : undefined,
          year: yearNum && yearNum > 1980 ? yearNum : undefined,
        },
      });
      setAuth(res.customer, res.token);
      const from = searchParams.get('from') ?? '/portal';
      router.replace(from.startsWith('/portal') ? from : '/portal');
    } catch (err) {
      setError(err instanceof PortalApiError ? err.message : 'No se pudo completar el registro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell relative min-h-[100dvh] overflow-hidden font-sans">
      <div className="auth-bg-layer" aria-hidden />
      <div className="auth-bg-vignette" aria-hidden />

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/8 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-cyan-500/6 blur-3xl" />

      <div className="relative z-[1] flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 shadow-lg shadow-emerald-500/20">
            <Wrench className="h-5 w-5 text-emerald-400" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight text-white">
              Moto<span className="text-gradient">Brain</span> <span className="text-emerald-400">AI</span>
            </p>
            <p className="text-[11px] text-zinc-400">Crea tu cuenta de cliente</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="auth-glass-card">
            <StepIndicator current={step} total={2} />

            {/* Step 1 — Datos personales */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-[1.25rem] font-bold tracking-tight text-white">Tus datos personales</h2>
                  <p className="mt-1 text-sm text-zinc-500">Para registrarte como cliente del taller</p>
                </div>

                {/* Nombre */}
                <div className="auth-field">
                  <label className="auth-label flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-zinc-500" />
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    placeholder="Juan Pérez"
                    value={s1.name}
                    onChange={(e) => { setS1((p) => ({ ...p, name: normalizeName(e.target.value) })); setS1Errors((p) => ({ ...p, name: '' })); }}
                    className="auth-input"
                    autoComplete="name"
                  />
                  {s1Errors.name && <p className="auth-error">{s1Errors.name}</p>}
                </div>

                {/* Celular */}
                <div className="auth-field">
                  <label className="auth-label flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-zinc-500" />
                    Celular
                  </label>
                  <input
                    type="tel"
                    placeholder="3001234567"
                    inputMode="numeric"
                    value={s1.phone}
                    onChange={(e) => { setS1((p) => ({ ...p, phone: normalizePhone(e.target.value) })); setS1Errors((p) => ({ ...p, phone: '' })); }}
                    className="auth-input"
                    autoComplete="tel"
                  />
                  {s1Errors.phone && <p className="auth-error">{s1Errors.phone}</p>}
                </div>

                {/* Cédula */}
                <div className="auth-field">
                  <label className="auth-label flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-zinc-500" />
                    Cédula
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    inputMode="numeric"
                    value={s1.cedula}
                    onChange={(e) => { setS1((p) => ({ ...p, cedula: normalizeCedula(e.target.value) })); setS1Errors((p) => ({ ...p, cedula: '' })); }}
                    className="auth-input"
                    autoComplete="off"
                  />
                  <p className="mt-0.5 text-[11px] text-zinc-600">Usada para iniciar sesión después</p>
                  {s1Errors.cedula && <p className="auth-error">{s1Errors.cedula}</p>}
                </div>

                {/* Email opcional */}
                <div className="auth-field">
                  <label className="auth-label flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-zinc-500" />
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="juan@email.com"
                    value={s1.email}
                    onChange={(e) => { setS1((p) => ({ ...p, email: e.target.value })); setS1Errors((p) => ({ ...p, email: '' })); }}
                    className="auth-input"
                    autoComplete="email"
                  />
                  {s1Errors.email && <p className="auth-error">{s1Errors.email}</p>}
                </div>

                <button
                  type="button"
                  onClick={() => { if (validateStep1()) setStep(1); }}
                  className="auth-submit mt-2"
                >
                  <span>Continuar</span>
                  <ChevronRight className="h-[18px] w-[18px]" />
                </button>
              </div>
            )}

            {/* Step 2 — Datos de la moto */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="mb-6">
                  <h2 className="text-[1.25rem] font-bold tracking-tight text-white">Tu moto</h2>
                  <p className="mt-1 text-sm text-zinc-500">Para hacer seguimiento de tus servicios</p>
                </div>

                {/* Placa */}
                <div className="auth-field">
                  <label className="auth-label flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-zinc-500" />
                    Placa
                  </label>
                  <input
                    type="text"
                    placeholder="ABC123"
                    value={s2.placa}
                    onChange={(e) => { setS2((p) => ({ ...p, placa: e.target.value.toUpperCase() })); setS2Errors((p) => ({ ...p, placa: '' })); }}
                    className="auth-input font-mono uppercase tracking-widest"
                    maxLength={7}
                  />
                  {s2Errors.placa && <p className="auth-error">{s2Errors.placa}</p>}
                </div>

                {/* Marca — chips */}
                {(() => {
                  const knownBrands = BRANDS.slice(0, -1); // todo excepto "Otro"
                  const isOtroMode = s2.brand === 'Otro' || (s2.brand !== '' && !knownBrands.includes(s2.brand));
                  const otroDisplayValue = isOtroMode && s2.brand !== 'Otro' ? s2.brand : '';
                  return (
                    <div className="auth-field">
                      <label className="auth-label">Marca</label>
                      <div className="flex flex-wrap gap-1.5">
                        {BRANDS.map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => {
                              setS2((p) => ({ ...p, brand: b }));
                              setS2Errors((p) => ({ ...p, brand: '' }));
                            }}
                            className={cn(
                              'rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all',
                              (s2.brand === b) || (b === 'Otro' && isOtroMode)
                                ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-300'
                                : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200',
                            )}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                      {isOtroMode && (
                        <input
                          type="text"
                          placeholder="¿Cuál marca? (ej: Lifan, Shineray, CF Moto...)"
                          autoFocus
                          defaultValue={otroDisplayValue}
                          className="auth-input mt-2"
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            setS2((p) => ({ ...p, brand: val || 'Otro' }));
                            setS2Errors((p) => ({ ...p, brand: '' }));
                          }}
                        />
                      )}
                      {s2Errors.brand && <p className="auth-error">{s2Errors.brand}</p>}
                    </div>
                  );
                })()}


                {/* Modelo */}
                <div className="auth-field">
                  <label className="auth-label">Modelo</label>
                  <input
                    type="text"
                    placeholder="Pulsar NS200, NKD 125..."
                    value={s2.model}
                    onChange={(e) => { setS2((p) => ({ ...p, model: e.target.value })); setS2Errors((p) => ({ ...p, model: '' })); }}
                    className="auth-input"
                  />
                  {s2Errors.model && <p className="auth-error">{s2Errors.model}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* CC */}
                  <div className="auth-field">
                    <label className="auth-label flex items-center gap-1">
                      <Gauge className="h-3 w-3 text-zinc-500" />
                      CC
                    </label>
                    <input
                      type="text"
                      placeholder="10.000"
                      inputMode="numeric"
                      value={s2.cc ? s2.cc.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '');
                        setS2((p) => ({ ...p, cc: raw }));
                      }}
                      className="auth-input"
                    />
                  </div>

                  {/* Año */}
                  <div className="auth-field">
                    <label className="auth-label flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-zinc-500" />
                      Año
                    </label>
                    <input
                      type="text"
                      placeholder="2022"
                      inputMode="numeric"
                      value={s2.year}
                      onChange={(e) => setS2((p) => ({ ...p, year: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      className="auth-input"
                    />
                  </div>
                </div>

                {/* Foto opcional */}
                <div className="auth-field">
                  <label className="auth-label flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-zinc-500" />
                    Foto de la moto
                    <OptionalBadge />
                  </label>
                  {s2.photoPreview ? (
                    <div className="relative overflow-hidden rounded-xl border border-zinc-700">
                      <img src={s2.photoPreview} alt="preview" className="h-32 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setS2((p) => ({ ...p, photoPreview: null })); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-20 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 text-zinc-500 transition hover:border-zinc-600 hover:text-zinc-400"
                    >
                      <Camera className="h-5 w-5" />
                      <span className="text-xs">Toca para agregar foto</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="auth-submit flex-1"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <span>Registrarme</span>
                        <ArrowRight className="h-[18px] w-[18px]" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-4">
            {[
              { icon: Gift, label: 'Registro gratuito' },
              { icon: Shield, label: 'Datos seguros' },
              { icon: Zap, label: 'Acceso inmediato' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                <Icon className="h-3 w-3 text-emerald-600" strokeWidth={1.75} />
                {label}
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-sm text-zinc-600">
            ¿Ya tienes cuenta?{' '}
            <a href="/login?tab=cliente" className="font-medium text-emerald-400 hover:text-emerald-300">
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export function PortalRegisterForm() {
  return (
    <Suspense>
      <PortalRegisterInner />
    </Suspense>
  );
}
