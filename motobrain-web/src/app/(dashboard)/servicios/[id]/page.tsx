'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Receipt, MessageCircle, Send, CheckCheck, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { ServiceStatusBadge } from '@/components/services/ServiceStatusBadge';
import { ServicePhotos } from '@/components/services/ServicePhotos';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { useService, useUpdateServiceStatus, useCloseService } from '@/hooks/use-services';
import { useSendServiceNotification, useServiceNotifications } from '@/hooks/use-send-notification';
import { SERVICE_TYPES, SERVICE_STATUSES } from '@/lib/constants';

export default function ServicioDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { data: service, isLoading } = useService(id);
  const updateStatus = useUpdateServiceStatus(id);
  const closeService = useCloseService(id);
  const sendNotif = useSendServiceNotification(id);
  const { data: notifHistory } = useServiceNotifications(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 animate-pulse rounded-xl bg-bg-elevated" />
        <div className="h-60 animate-pulse rounded-xl bg-bg-elevated" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-text-secondary">
        <p>Servicio no encontrado.</p>
        <button onClick={() => router.push('/servicios')} className="text-accent hover:underline text-sm">
          Volver a servicios
        </button>
      </div>
    );
  }

  const serviceLabel = SERVICE_TYPES.find((t) => t.id === service.type)?.label ?? service.type;

  function handleNotify(templateId: string) {
    sendNotif.mutate(
      { templateId },
      {
        onSuccess: (res) => {
          if (res.status === 'sent') toast.success('Mensaje enviado por WhatsApp');
          else toast.warning('Notificación registrada pero WhatsApp no está conectado');
        },
        onError: (e) => toast.error('Error al enviar', { description: (e as Error).message }),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Orden — ${serviceLabel}`}
        description={`${service.customerName ?? ''} · ${service.placa ?? ''}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/recibo/${id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors"
            >
              <Receipt className="h-4 w-4" /> Recibo
            </Link>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Información
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-tertiary">Estado</dt>
              <dd><ServiceStatusBadge status={service.status} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-tertiary">Mecánico</dt>
              <dd className="text-text-primary">{service.mechanicName ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-tertiary">Abierto</dt>
              <dd className="text-text-primary">
                {new Date(service.openedAt).toLocaleDateString('es-CO')}
              </dd>
            </div>
            {service.closedAt && (
              <div className="flex justify-between">
                <dt className="text-text-tertiary">Cerrado</dt>
                <dd className="text-text-primary">
                  {new Date(service.closedAt).toLocaleDateString('es-CO')}
                </dd>
              </div>
            )}
          </dl>
          {service.description && (
            <div className="border-t border-border pt-3">
              <p className="text-xs text-text-tertiary mb-1">Descripción</p>
              <p className="text-sm text-text-secondary">{service.description}</p>
            </div>
          )}
        </div>

        <div className="glass-card p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Resumen financiero
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-tertiary">Mano de obra</dt>
              <dd><MoneyDisplay value={service.laborCost} /></dd>
            </div>
            {service.products.map((p) => (
              <div key={p.productId} className="flex justify-between text-xs">
                <dt className="text-text-tertiary">
                  {p.productName} ×{p.quantity}
                </dt>
                <dd className="text-text-secondary"><MoneyDisplay value={p.subtotal} /></dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <dt className="text-text-primary">Total</dt>
              <dd className="text-accent"><MoneyDisplay value={service.total} /></dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="glass-card p-5">
        <ServicePhotos serviceId={id} photos={(service as any).photos ?? []} />
      </div>

      {service.status !== 'closed' && service.status !== 'cancelled' && (
        <div className="glass-card p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Cambiar estado
          </h2>
          <div className="flex flex-wrap gap-2">
            {SERVICE_STATUSES.filter((s) => s.id !== service.status && s.id !== 'closed').map((s) => (
              <button
                key={s.id}
                onClick={() =>
                  updateStatus.mutate(
                    { status: s.id as any },
                    { onSuccess: () => toast.info(`Estado actualizado: ${s.label}`) },
                  )
                }
                disabled={updateStatus.isPending}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent disabled:opacity-40 transition-colors"
              >
                → {s.label}
              </button>
            ))}
            <button
              onClick={() =>
                closeService.mutate(undefined, {
                  onSuccess: () =>
                    toast.success('Servicio cerrado', {
                      description: 'Se notificó al cliente por WhatsApp si está conectado.',
                      duration: 6_000,
                    }),
                  onError: (e) => toast.error('Error al cerrar', { description: (e as Error).message }),
                })
              }
              disabled={closeService.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 border border-success/30 px-3 py-1.5 text-sm font-medium text-success hover:bg-success/20 disabled:opacity-40 transition-colors"
            >
              <CheckCircle className="h-4 w-4" /> Cerrar servicio
            </button>
          </div>
        </div>
      )}

      {service.status !== 'cancelled' && (
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" /> Notificar por WhatsApp
          </h2>
          <div className="flex flex-wrap gap-2">
            {service.status === 'closed' && (
              <button
                onClick={() => handleNotify('service_completed')}
                disabled={sendNotif.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 border border-accent/30 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/20 disabled:opacity-40 transition-colors"
              >
                <Send className="h-3.5 w-3.5" /> Moto lista para recoger
              </button>
            )}
            {service.status !== 'closed' && (
              <button
                onClick={() => handleNotify('service_update')}
                disabled={sendNotif.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent disabled:opacity-40 transition-colors"
              >
                <Send className="h-3.5 w-3.5" /> Enviar actualización
              </button>
            )}
            <button
              onClick={() => handleNotify('payment_ready')}
              disabled={sendNotif.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent disabled:opacity-40 transition-colors"
            >
              <Send className="h-3.5 w-3.5" /> Aviso de pago
            </button>
          </div>

          {notifHistory && notifHistory.data.length > 0 && (
            <div className="border-t border-border pt-3 space-y-2">
              <p className="text-xs text-text-tertiary">Últimas notificaciones</p>
              {notifHistory.data.slice(0, 4).map((n) => (
                <div key={n.id} className="space-y-0.5">
                  <div className="flex items-start justify-between text-xs gap-2">
                    <div className="flex items-center gap-1.5 text-text-tertiary">
                      {n.status === 'sent' ? (
                        <CheckCheck className="h-3.5 w-3.5 text-success shrink-0" />
                      ) : n.status === 'failed' ? (
                        <XCircle className="h-3.5 w-3.5 text-error shrink-0" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="capitalize">{n.type.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-text-tertiary shrink-0">
                      {new Date(n.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {n.status === 'failed' && n.errorMsg && (
                    <p className="text-xs text-error pl-5">{n.errorMsg}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
