'use client';

import { Bike, Gauge, Calendar, Plus } from 'lucide-react';
import type { Motorcycle } from '@/types/entities';
import { useRouter } from 'next/navigation';

interface MotorcycleCardProps {
  motorcycle: Motorcycle;
}

interface AddMotorcycleCardProps {
  customerId: string;
}

export function MotorcycleCard({ motorcycle: m }: MotorcycleCardProps) {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
          <Bike className="h-5 w-5 text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-base font-semibold text-text-primary tracking-wider">
            {m.placa}
          </div>
          <div className="text-sm text-text-secondary">
            {m.brand} {m.model} {m.year && `(${m.year})`}
          </div>
        </div>
        {m.cc && (
          <span className="shrink-0 rounded-full bg-bg-elevated px-2 py-0.5 text-xs text-text-tertiary">
            {m.cc} cc
          </span>
        )}
      </div>
      <div className="flex gap-4 text-xs text-text-tertiary">
        <span className="flex items-center gap-1">
          <Gauge className="h-3.5 w-3.5" />
          {m.kmCurrent.toLocaleString('es-CO')} km
        </span>
        {m.lastServiceAt && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Último: {new Date(m.lastServiceAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  );
}

export function AddMotorcycleCard({ customerId }: AddMotorcycleCardProps) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/clientes/${customerId}/moto/nueva`)}
      className="glass-card flex h-full min-h-[96px] w-full flex-col items-center justify-center gap-2 border-dashed text-text-tertiary hover:border-accent hover:text-accent transition-colors"
    >
      <Plus className="h-6 w-6" />
      <span className="text-xs font-medium">Agregar moto</span>
    </button>
  );
}
