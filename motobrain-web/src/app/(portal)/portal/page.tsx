'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ColombiaFlag } from '@/components/ui/ColombiaFlag';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bike, Wrench, Calendar, DollarSign, Plus, ChevronRight,
  ClipboardList, MessageCircle, Heart, Sparkles, ArrowRight,
  Clock, CheckCircle2, X,
} from 'lucide-react';
import { portalApi } from '@/lib/portal-api-client';
import { usePortalAuthStore } from '@/stores/portal-auth-store';
import { usePortalAI } from '@/components/portal/PortalAIProvider';
import {
  type PortalMotorcycle,
  type PortalService,
  type PortalWorkshop,
  PortalStatusBadge,
  formatCop,
  formatPortalDate,
} from '@/components/portal/portal-shared';
import { formatServiceLabel } from '@/lib/utils';
import { PortalAddMotoSheet } from '@/components/portal/PortalAddMotoSheet';
import { PortalScheduleSheet } from '@/components/portal/PortalScheduleSheet';
import { PortalWorkshopReplyBanner } from '@/components/portal/PortalWorkshopReplyBanner';
import { MotoBrandPlaceholder } from '@/components/shared/MotoBrandPlaceholder';

interface PortalDashboardData {
  customer: { id: string; name: string; phone: string; email: string | null; cedula: string };
  workshop: PortalWorkshop;
  motorcycles: PortalMotorcycle[];
  services: PortalService[];
  appointments: PortalAppointment[];
}

interface PortalAppointment {
  id: string;
  notes: string | null;
  preferredDate: string | null;
  scheduledAt: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  motorcycle: { placa: string; brand: string; model: string } | null;
}

const APPT_STATUS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

function fmtApptWhen(a: PortalAppointment) {
  const d = a.scheduledAt ?? a.preferredDate;
  if (!d) return 'Por definir';
  const s = new Date(d).toLocaleString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}


function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits.startsWith('57') ? digits : `57${digits}`}`;
}

const SERVICE_STEPS = ['open', 'in_progress', 'closed'];

export default function PortalDashboard() {
  const { customer } = usePortalAuthStore();
  const { openAI } = usePortalAI();
  const qc = useQueryClient();
  const [addMotoOpen, setAddMotoOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const cancelAppt = useMutation({
    mutationFn: (id: string) => portalApi.patch(`/appointments/${id}/cancel`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['portal-dashboard'] });
      setCancellingId(null);
    },
    onError: () => setCancellingId(null),
  });

  const { data: dash, isLoading } = useQuery<PortalDashboardData>({
    queryKey: ['portal-dashboard'],
    queryFn: () => portalApi.get<PortalDashboardData>('/dashboard'),
    staleTime: 30_000,
  });

  const services = dash?.services ?? [];
  const appointments = dash?.appointments ?? [];
  const activeServices = services.filter((s) => s.status === 'open' || s.status === 'in_progress');
  const historyServices = services.filter((s) => s.status === 'closed' || s.status === 'cancelled');
  const totalSpent = services.filter((s) => s.status === 'closed').reduce((sum, s) => sum + (s.totalCost ?? 0), 0);
  const activePlacas = new Set(activeServices.map((s) => s.motorcycle.placa));
  const nextAppointment = appointments.find(
    (a) => a.status === 'pending' || a.status === 'confirmed',
  ) ?? null;
  const firstName = (customer?.name ?? dash?.customer?.name ?? '').split(' ')[0] || 'Cliente';
  const workshopPhone = dash?.workshop?.phone;

  function latestServiceForPlaca(placa: string) {
    return services
      .filter((s) => s.motorcycle.placa === placa)
      .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())[0];
  }

  return (
    <div className="space-y-7" id="inicio">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-zinc-900 p-5 pb-6 ring-1 ring-emerald-500/15">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-4 right-10 h-24 w-24 rounded-full bg-emerald-400/8 blur-xl" />

        <h1 className="text-[1.6rem] font-bold leading-tight text-white">
          Hola, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {activeServices.length > 0
            ? `Tienes ${activeServices.length} servicio${activeServices.length > 1 ? 's' : ''} activo${activeServices.length > 1 ? 's' : ''} en el taller`
            : 'Todo en orden por ahora'}
        </p>

        <div className="mt-5 grid grid-cols-3 divide-x divide-zinc-700/60">
          {[
            { label: 'Motos', value: dash?.motorcycles?.length ?? 0, icon: Bike },
            { label: 'Activos', value: activeServices.length, icon: Wrench },
            { label: 'Gastado', value: totalSpent > 0 ? formatCop(totalSpent) : '$0', icon: DollarSign },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-1 px-2 first:pl-0 last:pr-0">
              <Icon className="h-4 w-4 text-emerald-400/60" strokeWidth={1.75} />
              <p className="text-base font-bold tabular-nums text-white">{value}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUICK ACTIONS ────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Agendar', icon: Calendar, action: () => setScheduleOpen(true), accent: false },
            { label: 'Mis motos', icon: Bike, href: '#motos', accent: false },
            { label: 'IA', icon: Sparkles, action: () => openAI(), accent: true },
            { label: 'WhatsApp', icon: MessageCircle, href: workshopPhone ? whatsappUrl(workshopPhone) : undefined, external: true, accent: false },
          ].map(({ label, icon: Icon, action, href, external, accent }) => {
            const cls = `flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all active:scale-95 touch-manipulation ${
              accent
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15'
                : 'border-zinc-800 bg-zinc-900/70 text-zinc-300 hover:border-zinc-700 hover:text-white'
            }`;
            const content = (
              <>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent ? 'bg-emerald-500/20' : 'bg-zinc-800'}`}>
                  <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" strokeWidth={1.75} />
                </div>
                <span className="text-[11px] font-medium">{label}</span>
              </>
            );
            if (href)
              return external
                ? <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={cls}>{content}</a>
                : <a key={label} href={href} className={cls}>{content}</a>;
            return <button key={label} type="button" onClick={action} className={cls}>{content}</button>;
          })}
        </div>
      </section>

      {/* ── BANNER RESPUESTA TALLER ───────────────────────── */}
      <PortalWorkshopReplyBanner />

      {/* ── SERVICIOS ACTIVOS ─────────────────────────────── */}
      {(activeServices.length > 0 || isLoading) && (
        <section id="servicios" className="scroll-mt-24 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">En el taller ahora</h2>
            {activeServices.length > 2 && (
              <Link href="#servicios" className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                Ver todos <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-24 animate-pulse rounded-2xl bg-zinc-800/60" />
              <div className="h-24 animate-pulse rounded-2xl bg-zinc-800/60" />
            </div>
          ) : (
            <div className="space-y-3">
              {activeServices.map((s) => {
                const stepIdx = SERVICE_STEPS.indexOf(s.status);
                return (
                  <Link
                    key={s.id}
                    href={`/portal/servicios/${s.id}`}
                    className="block overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 p-4 transition-all active:scale-[.99] hover:border-amber-500/35"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{formatServiceLabel(s.type)}</p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {s.motorcycle.placa} · {s.motorcycle.brand} {s.motorcycle.model}
                        </p>
                      </div>
                      <PortalStatusBadge status={s.status} />
                    </div>
                    <div className="mt-3 flex gap-1">
                      {SERVICE_STEPS.slice(0, -1).map((step, i) => (
                        <div
                          key={step}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${i <= stepIdx ? 'bg-amber-400' : 'bg-zinc-700/80'}`}
                        />
                      ))}
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] font-medium text-zinc-600">
                      <span>Recibida</span><span>En taller</span><span>Lista</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── PRÓXIMA CITA ──────────────────────────────────── */}
      {nextAppointment && (
        <section className="overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-950/40 via-zinc-900 to-zinc-900 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15">
                <Calendar className="h-5 w-5 text-sky-400" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-sky-400/80">Próxima cita</p>
                <p className="text-sm font-semibold text-white">
                  {nextAppointment.motorcycle
                    ? `${nextAppointment.motorcycle.placa} · ${nextAppointment.motorcycle.brand}`
                    : 'Revisión general'}
                </p>
                <p className="text-xs text-zinc-400">{fmtApptWhen(nextAppointment)}</p>
              </div>
            </div>
            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${
              nextAppointment.status === 'confirmed'
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                : 'border-amber-500/25 bg-amber-500/10 text-amber-400'
            }`}>
              {APPT_STATUS[nextAppointment.status]}
            </span>
          </div>
        </section>
      )}

      {/* ── MIS MOTOS ─────────────────────────────────────── */}
      <section id="motos" className="scroll-mt-24 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Mis motos</h2>
          <button
            type="button"
            onClick={() => setAddMotoOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar
          </button>
        </div>

        {dash?.motorcycles && dash?.motorcycles.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
            {dash?.motorcycles.map((m) => {
              const inShop = activePlacas.has(m.placa);
              const last = latestServiceForPlaca(m.placa);
              return (
                <div
                  key={m.id}
                  className="relative flex w-52 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80"
                >
                  {inShop && (
                    <div className="absolute right-2 top-2 z-10 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                      En taller
                    </div>
                  )}
                  <div className="relative h-32 w-full bg-zinc-800/80">
                    {m.imageUrl ? (
                      <>
                        <Image
                          src={m.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="208px"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                      </>
                    ) : (
                      <MotoBrandPlaceholder brand={m.brand} />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="font-mono text-sm font-bold tracking-wider text-white">{m.placa}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-400">{m.brand} {m.model}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-600">{m.cc}cc{m.year ? ` · ${m.year}` : ''}</p>
                    {last && (
                      <Link
                        href={`/portal/servicios/${last.id}`}
                        className="mt-auto flex items-center justify-between rounded-lg bg-zinc-800/70 px-2.5 py-1.5 pt-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-700/80"
                      >
                        Último servicio <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setAddMotoOpen(true)}
              className="flex w-36 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700/70 bg-zinc-900/40 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-400"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">Agregar moto</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddMotoOpen(true)}
            className="flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-700/70 bg-zinc-900/40 py-10 text-zinc-500 transition-colors hover:border-zinc-600"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
              <Bike className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-300">Registra tu moto</p>
              <p className="text-xs text-zinc-600">Toca para agregar</p>
            </div>
          </button>
        )}
      </section>

      {/* ── HISTORIAL ─────────────────────────────────────── */}
      {historyServices.length > 0 && (
        <section id="historial" className="scroll-mt-24 space-y-3">
          <h2 className="text-base font-semibold text-white">Historial de servicios</h2>
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
            {historyServices.slice(0, 5).map((s, i) => (
              <Link
                key={s.id}
                href={`/portal/servicios/${s.id}`}
                className={`flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-zinc-800/60 active:bg-zinc-800 ${i !== 0 ? 'border-t border-zinc-800/80' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400/70" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{formatServiceLabel(s.type)}</p>
                    <p className="text-[11px] text-zinc-500">
                      {s.motorcycle.placa} · {formatPortalDate(s.closedAt ?? s.serviceDate)}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-white">
                  {formatCop(s.totalCost)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── CITAS ─────────────────────────────────────────── */}
      {appointments.length > 0 && (
        <section id="citas" className="scroll-mt-24 space-y-3">
          <h2 className="text-base font-semibold text-white">Mis citas</h2>
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
            {appointments.slice(0, 5).map((a, i) => (
              <div key={a.id} className={`flex items-start gap-3 px-4 py-3.5 ${i !== 0 ? 'border-t border-zinc-800/80' : ''}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 mt-0.5">
                  <Clock className="h-4 w-4 text-sky-400/70" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {a.motorcycle ? `${a.motorcycle.placa} · ${a.motorcycle.brand}` : 'Revisión general'}
                  </p>
                  <p className="text-[11px] text-zinc-500">{fmtApptWhen(a)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                    a.status === 'confirmed'
                      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                      : a.status === 'cancelled'
                        ? 'border-zinc-700/50 bg-zinc-800/50 text-zinc-500'
                        : 'border-amber-500/25 bg-amber-500/10 text-amber-400'
                  }`}>
                    {APPT_STATUS[a.status]}
                  </span>
                  {(a.status === 'pending' || a.status === 'confirmed') && (
                    cancellingId === a.id
                      ? (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => { setCancellingId(null); }}
                            className="rounded-lg border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-200"
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelAppt.mutate(a.id)}
                            disabled={cancelAppt.isPending}
                            className="rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                          >
                            {cancelAppt.isPending ? '...' : 'Sí, cancelar'}
                          </button>
                        </div>
                      )
                      : (
                        <button
                          type="button"
                          onClick={() => setCancellingId(a.id)}
                          className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          <X className="h-3 w-3" /> Cancelar
                        </button>
                      )
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SIN SERVICIOS ACTIVOS ─────────────────────────── */}
      {!isLoading && activeServices.length === 0 && (
        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 px-5 py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
            <ClipboardList className="h-6 w-6 text-zinc-500" strokeWidth={1.5} />
          </div>
          <p className="font-medium text-zinc-300">No tienes servicios activos</p>
          <p className="mt-1 text-sm text-zinc-600">¿Necesitas una revisión?</p>
          <button
            type="button"
            onClick={() => setScheduleOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
          >
            <Calendar className="h-4 w-4" /> Agendar cita
          </button>
        </section>
      )}

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="flex flex-col items-center justify-between gap-3 border-t border-zinc-800/80 pt-6 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <Wrench className="h-4 w-4 text-emerald-500/60" />
          <span>MotoBrain</span>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-zinc-600">
          Hecho con <Heart className="h-3 w-3 fill-red-500/60 text-red-500/60" /> en Colombia
          <ColombiaFlag size={16} className="inline-block" />
        </p>
      </footer>

      <PortalAddMotoSheet open={addMotoOpen} onOpenChange={setAddMotoOpen} />
      <PortalScheduleSheet
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        motorcycles={dash?.motorcycles ?? []}
      />
    </div>
  );
}
