'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { portalApi } from '@/lib/portal-api-client';

interface PortalAddMotoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PortalAddMotoSheet({ open, onOpenChange }: PortalAddMotoSheetProps) {
  const queryClient = useQueryClient();
  const [placa, setPlaca] = useState('');
  const [brand, setBrand] = useState('AKT');
  const [model, setModel] = useState('TT DS 200');
  const [cc, setCc] = useState('200');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await portalApi.post('/motorcycles', {
        placa: placa.trim(),
        brand: brand.trim(),
        model: model.trim(),
        cc: Number(cc) || 125,
        year: year ? Number(year) : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['portal-me'] });
      setPlaca('');
      setBrand('AKT');
      setModel('TT DS 200');
      setCc('200');
      setYear('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la moto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Cerrar"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Agregar moto</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-400">Placa *</span>
            <input
              required
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              className="portal-input w-full"
              placeholder="ABC123"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">Marca *</span>
              <input
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="portal-input w-full"
                placeholder="AKT"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">Modelo *</span>
              <input
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="portal-input w-full"
                placeholder="TT DS 200"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">Cilindraje (cc)</span>
              <input
                type="number"
                min={50}
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="portal-input w-full"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">Año</span>
              <input
                type="number"
                min={1990}
                max={2030}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="portal-input w-full"
                placeholder="2024"
              />
            </label>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="portal-btn-primary w-full justify-center">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar moto'}
          </button>
        </form>
      </div>
    </div>
  );
}
