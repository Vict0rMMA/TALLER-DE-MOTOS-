'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ColombiaFlag } from '@/components/ui/ColombiaFlag';
import { useQuery } from '@tanstack/react-query';
import {
  Bike,
  Wrench,
  Calendar,
  DollarSign,
  Plus,
  ChevronRight,
  ClipboardList,
  MessageCircle,
  Heart,
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

interface Me {
  id: string;
  name: string;
  workshop: PortalWorkshop;
  motorcycles: PortalMotorcycle[];
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
  pending: 'Pendiente de confirmación',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

function fmtApptWhen(a: PortalAppointment) {
  const d = a.scheduledAt ?? a.preferredDate;
  if (!d) return 'Por definir';
  return new Date(d).toLocaleString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const MOTO_THUMB = '/images/moto-akt-tt-ds.png';

function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits.startsWith('57') ? digits : `57${digits}`}`;
}

function StatCard({
  label,
  value,
  icon: Icon,
  linkLabel,
  href,
  onLinkClick,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  linkLabel: string;
  href?: string;
  onLinkClick?: () => void;
}) {
  const linkClass =
    'mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300';

  return (
    <div className="portal-card group p-5 transition-colors hover:border-zinc-700/80">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white tabular-nums">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-800/50 text-zinc-400 transition-colors group-hover:border-emerald-500/20 group-hover:text-emerald-400">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
      {href ? (
        <a href={href} className={linkClass}>
          {linkLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </a>
      ) : (
        <button type="button" onClick={onLinkClick} className={linkClass}>
          {linkLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default function PortalDashboard() {
  const { customer } = usePortalAuthStore();
  const { openAI } = usePortalAI();
  const [addMotoOpen, setAddMotoOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const { data: me } = useQuery<Me>({
    queryKey: ['portal-me'],
    queryFn: () => portalApi.get<Me>('/me'),
  });

  const { data: services = [], isLoading } = useQuery<PortalService[]>({
    queryKey: ['portal-services'],
    queryFn: () => portalApi.get<PortalService[]>('/services'),
  });

  const { data: nextAppointment } = useQuery<PortalAppointment | null>({
    queryKey: ['portal-appointment-next'],
    queryFn: () => portalApi.get<PortalAppointment | null>('/appointments/next'),
  });

  const { data: appointments = [] } = useQuery<PortalAppointment[]>({
    queryKey: ['portal-appointments'],
    queryFn: () => portalApi.get<PortalAppointment[]>('/appointments'),
  });

  const activeServices = services.filter((s) => s.status === 'open' || s.status === 'in_progress');
  const historyServices = services.filter((s) => s.status === 'closed' || s.status === 'cancelled');

  const totalSpent = services
    .filter((s) => s.status === 'closed')
    .reduce((sum, s) => sum + (s.totalCost ?? 0), 0);

  const activePlacas = new Set(activeServices.map((s) => s.motorcycle.placa));
  const firstName = (customer?.name ?? me?.name ?? '').split(' ')[0] || 'Cliente';
  const workshopPhone = me?.workshop?.phone;

  function latestServiceForPlaca(placa: string) {
    return services
      .filter((s) => s.motorcycle.placa === placa)
      .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())[0];
  }

  return (
    <div className="space-y-10" id="inicio">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-[1.75rem]">
          Hola, {firstName} 👋
        </h1>
        <p className="mt-1 text-[15px] text-zinc-500">Así está tu taller hoy.</p>
      </section>

      <PortalWorkshopReplyBanner />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Motos registradas"
          value={String(me?.motorcycles?.length ?? 0)}
          icon={Bike}
          linkLabel="Ver mis motos"
          href="#motos"
        />
        <StatCard
          label="Servicios activos"
          value={String(activeServices.length)}
          icon={Wrench}
          linkLabel="Ver servicios"
          href="#servicios"
        />
        <StatCard
          label="Próxima cita"
          value={
            nextAppointment
              ? nextAppointment.status === 'pending'
                ? 'Pendiente'
                : fmtApptWhen(nextAppointment).split(',')[0] ?? fmtApptWhen(nextAppointment)
              : 'Sin citas'
          }
          icon={Calendar}
          linkLabel={nextAppointment ? 'Ver mis citas' : 'Agendar ahora'}
          onLinkClick={() => (nextAppointment ? document.getElementById('citas')?.scrollIntoView({ behavior: 'smooth' }) : setScheduleOpen(true))}
        />
        <StatCard
          label="Total gastado"
          value={formatCop(totalSpent)}
          icon={DollarSign}
          linkLabel="Ver historial"
          href="#historial"
        />
      </section>

      {appointments.length > 0 && (
        <section id="citas" className="scroll-mt-24 space-y-4">
          <h2 className="text-lg font-semibold text-white">Mis citas</h2>
          <div className="space-y-3">
            {appointments.slice(0, 5).map((a) => (
              <div key={a.id} className="portal-card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-white">
                    {a.motorcycle ? `${a.motorcycle.placa} · ${a.motorcycle.brand}` : 'Revisión general'}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-400">{fmtApptWhen(a)}</p>
                  {a.notes && <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{a.notes}</p>}
                </div>
                <span
                  className={
                    a.status === 'confirmed'
                      ? 'rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400'
                      : 'rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400'
                  }
                >
                  {APPT_STATUS[a.status] ?? a.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="motos" className="scroll-mt-24 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Mis motos</h2>
          <button
            type="button"
            onClick={() => setAddMotoOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Agregar moto
          </button>
        </div>

        {me?.motorcycles && me.motorcycles.length > 0 ? (
          <div className="space-y-3">
            {me.motorcycles.map((m) => {
              const inShop = activePlacas.has(m.placa);
              const last = latestServiceForPlaca(m.placa);
              return (
                <div key={m.id} className="portal-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-zinc-800 sm:h-24 sm:w-36">
                    <Image
                      src={m.imageUrl || MOTO_THUMB}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="144px"
                      unoptimized={!!m.imageUrl}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-lg font-semibold tracking-wide text-white">{m.placa}</p>
                      {inShop && (
                        <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                          En taller
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-zinc-300">
                      {m.brand} {m.model}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {m.year ?? '—'}
                      {last
                        ? ` · Última actualización: ${formatPortalDate(last.serviceDate)}`
                        : ''}
                    </p>
                  </div>
                  {last && (
                    <Link
                      href={`/portal/servicios/${last.id}`}
                      className="portal-btn-outline shrink-0 self-start sm:self-center"
                    >
                      Ver detalles
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="portal-card flex flex-col items-center py-12 text-center">
            <Bike className="h-10 w-10 text-zinc-600" strokeWidth={1.5} />
            <p className="mt-3 text-sm text-zinc-400">Aún no tienes motos registradas.</p>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section id="servicios" className="scroll-mt-24 space-y-4">
          <h2 className="text-lg font-semibold text-white">Servicios activos</h2>
          {isLoading ? (
            <div className="portal-card h-40 animate-pulse" />
          ) : activeServices.length > 0 ? (
            <div className="space-y-3">
              {activeServices.map((s) => (
                <Link key={s.id} href={`/portal/servicios/${s.id}`} className="portal-card block p-4 transition-colors hover:border-zinc-700">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{formatServiceLabel(s.type)}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {s.motorcycle.placa} · {formatPortalDate(s.serviceDate)}
                      </p>
                    </div>
                    <PortalStatusBadge status={s.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="portal-card flex flex-col items-center py-12 text-center">
              <ClipboardList className="h-10 w-10 text-zinc-600" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium text-zinc-300">No tienes servicios activos</p>
              <button type="button" onClick={() => setScheduleOpen(true)} className="portal-btn-outline mt-5">
                Agendar revisión
              </button>
            </div>
          )}
        </section>

        <section id="historial" className="scroll-mt-24 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Historial de servicios</h2>
            {historyServices.length > 0 && (
              <a href="#historial" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
                Ver todo
              </a>
            )}
          </div>

          {historyServices.length > 0 ? (
            <div className="portal-card divide-y divide-zinc-800/80 overflow-hidden">
              {historyServices.map((s) => (
                <Link
                  key={s.id}
                  href={`/portal/servicios/${s.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-zinc-900/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white">{formatServiceLabel(s.type)}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {s.motorcycle.placa} · {formatPortalDate(s.closedAt ?? s.serviceDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <PortalStatusBadge status={s.status} />
                    <p className="text-sm font-semibold tabular-nums text-white">{formatCop(s.totalCost)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="portal-card py-10 text-center text-sm text-zinc-500">
              Sin historial todavía.
            </div>
          )}
        </section>
      </div>

      <section className="portal-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-800/60">
            <MessageCircle className="h-5 w-5 text-zinc-400" strokeWidth={1.75} />
          </div>
          <div>
            <p className="font-medium text-white">¿Tienes una pregunta?</p>
            <p className="mt-0.5 text-sm text-zinc-500">Estamos aquí para ayudarte.</p>
          </div>
        </div>
        {workshopPhone ? (
          <a
            href={whatsappUrl(workshopPhone)}
            target="_blank"
            rel="noopener noreferrer"
            className="portal-btn-primary shrink-0"
          >
            <MessageCircle className="h-4 w-4" />
            Escríbenos por WhatsApp
            <ChevronRight className="h-4 w-4" />
          </a>
        ) : (
          <button type="button" onClick={() => openAI()} className="portal-btn-primary shrink-0">
            Hablar con la IA
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </section>

      <PortalAddMotoSheet open={addMotoOpen} onOpenChange={setAddMotoOpen} />
      <PortalScheduleSheet
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        motorcycles={me?.motorcycles ?? []}
      />

      <footer className="flex flex-col items-center justify-between gap-4 border-t border-zinc-800/80 pt-8 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Wrench className="h-4 w-4 text-emerald-500/80" />
          <span>MotoBrain</span>
        </div>
        <p className="text-xs text-zinc-600">© 2026 MotoBrain AI</p>
        <p className="flex items-center gap-1.5 text-xs text-zinc-500">
          Hecho con <Heart className="h-3 w-3 fill-red-500/80 text-red-500/80" /> en Colombia
          <ColombiaFlag size={18} className="inline-block" />
        </p>
      </footer>
    </div>
  );
}
