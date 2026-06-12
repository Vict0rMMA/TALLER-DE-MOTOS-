'use client';

import { useState, useRef } from 'react';
import { Loader2, X, Camera, Bike } from 'lucide-react';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { portalApi } from '@/lib/portal-api-client';

interface PortalAddMotoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PortalAddMotoSheet({ open, onOpenChange }: PortalAddMotoSheetProps) {
  const queryClient = useQueryClient();
  const [placa, setPlaca] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [cc, setCc] = useState('');
  const [year, setYear] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }

  function reset() {
    setPlaca(''); setBrand(''); setModel(''); setCc(''); setYear('');
    setImagePreview(null); setImageBase64(null); setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const moto = await portalApi.post<{ id: string }>('/motorcycles', {
        placa: placa.trim(),
        brand: brand.trim(),
        model: model.trim(),
        cc: Number(cc) || 125,
        year: year ? Number(year) : undefined,
      });

      if (imageBase64 && moto?.id) {
        try {
          await portalApi.patch(`/motorcycles/${moto.id}/photo`, {
            imageBase64,
            imageMimeType,
          });
        } catch {
          // no bloquear si falla la foto
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['portal-me'] });
      reset();
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
        onClick={() => { reset(); onOpenChange(false); }}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Agregar moto</h2>
          <button
            type="button"
            onClick={() => { reset(); onOpenChange(false); }}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Foto */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">Foto de la moto</span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-700 bg-zinc-900 transition-colors hover:border-zinc-600"
            >
              {imagePreview ? (
                <Image src={imagePreview} alt="" fill className="object-cover" unoptimized />
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                    <Camera className="h-5 w-5" />
                  </div>
                  <span className="text-xs">Toca para agregar foto</span>
                </div>
              )}
              {imagePreview && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </div>

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
                placeholder="Yamaha"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">Modelo *</span>
              <input
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="portal-input w-full"
                placeholder="NMAX 155"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">Cilindraje (cc) *</span>
              <input
                required
                type="number"
                min={50}
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="portal-input w-full"
                placeholder="155"
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
