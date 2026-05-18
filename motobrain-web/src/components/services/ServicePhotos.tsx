'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, Trash2, X, Loader2, ImagePlus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface ServicePhotosProps {
  serviceId: string;
  photos: string[];
  readOnly?: boolean;
}

export function ServicePhotos({ serviceId, photos, readOnly = false }: ServicePhotosProps) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const remove = useMutation({
    mutationFn: (url: string) => api.delete(`/services/${serviceId}/photos`, { url }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service', serviceId] });
      toast.success('Foto eliminada');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      await api.uploadForm(`/services/${serviceId}/photos`, form);
      qc.invalidateQueries({ queryKey: ['service', serviceId] });
      toast.success('Foto subida');
    } catch (err) {
      toast.error('No se pudo subir', { description: (err as Error).message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
          Fotos ({photos.length}/10)
        </h2>
        {!readOnly && photos.length < 10 && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" />
            )}
            {uploading ? 'Subiendo…' : 'Agregar foto'}
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {photos.length === 0 ? (
        <button
          type="button"
          onClick={() => !readOnly && fileRef.current?.click()}
          className={cn(
            'flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 text-sm text-text-tertiary transition-colors',
            !readOnly && 'hover:border-accent hover:text-accent cursor-pointer',
          )}
        >
          <Camera className="h-7 w-7" strokeWidth={1.5} />
          {readOnly ? 'Sin fotos' : 'Toca para agregar la primera foto'}
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-lg bg-bg-elevated">
              <Image
                src={url}
                alt="Foto del servicio"
                fill
                className="object-cover cursor-pointer"
                sizes="(max-width: 640px) 33vw, 25vw"
                onClick={() => setLightbox(url)}
                unoptimized
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => remove.mutate(url)}
                  disabled={remove.isPending}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-bg-primary/80 text-danger opacity-0 transition-opacity group-hover:opacity-100 hover:bg-danger hover:text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {!readOnly && photos.length < 10 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border text-text-tertiary hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            </button>
          )}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-bg-primary/60 p-2 text-white hover:bg-bg-primary"
            onClick={() => setLightbox(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative max-h-[90dvh] max-w-[90dvw]">
            <img src={lightbox} alt="Foto ampliada" className="max-h-[90dvh] max-w-[90dvw] rounded-lg object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
